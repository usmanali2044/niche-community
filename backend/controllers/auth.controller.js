import User from "../models/user.model.js";
import Community from "../models/community.model.js";
import Profile from "../models/profile.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { generateTokenandSetCookie } from "../utils/generateTokenandSetCookie.js";

import {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendResetPasswordEmail,
    sendResetSuccessEmail,
} from "../mailtrap/emails.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const withTier = async (userDocOrLean) => {
    const userId = userDocOrLean?._id;
    if (!userId) return userDocOrLean;
    const profile = await Profile.findOne({ userId }).select("tier").lean();
    return {
        ...userDocOrLean,
        tier: profile?.tier || "free",
    };
};

// ── Google OAuth ───────────────────────────────────────────────────────────
export const googleAuth = async (req, res) => {
    const { credential, inviteCode } = req.body;

    try {
        if (!credential) {
            return res.status(400).json({ success: false, message: "Google credential is required" });
        }

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({ success: false, message: "Could not retrieve email from Google" });
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            // ── Existing user → log them in ─────────────────────────────────
            generateTokenandSetCookie(res, user._id);
            user.lastLogin = new Date();
            if (!user.googleId) user.googleId = googleId;
            await user.save();

            const populatedUser = await User.findById(user._id)
                .populate("memberships.communityId", "name slug icon")
                .lean();

            return res.status(200).json({
                success: true,
                message: "Logged in with Google",
                user: { ...(await withTier(populatedUser)), password: undefined },
            });
        }

        // ── New user → require invite code ──────────────────────────────────
        if (!inviteCode) {
            return res.status(400).json({
                success: false,
                message: "Invite code is required for new accounts",
            });
        }

        // Validate invite code
        const community = await Community.findOne({
            "inviteCodes.code": inviteCode.trim(),
            "inviteCodes.isUsed": false,
        });
        if (!community) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used invite code",
            });
        }

        const inviteEntry = community.inviteCodes.find(
            (inv) => inv.code === inviteCode.trim() && !inv.isUsed
        );
        if (!inviteEntry) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used invite code",
            });
        }
        if (inviteEntry.expiresAt && new Date(inviteEntry.expiresAt) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "This invite code has expired",
            });
        }

        // Create user (no password needed, email auto-verified via Google)
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = new User({
            email,
            name: name || email.split("@")[0],
            password: hashedPassword,
            googleId,
            isInviteVerified: true,
            isVerified: true,  // Google already verified the email
        });
        await user.save();

        // Mark invite code as used
        inviteEntry.isUsed = true;
        inviteEntry.usedBy = user._id;
        community.members.push(user._id);
        await community.save();

        // Add membership
        user.memberships.push({ communityId: community._id, role: "member" });
        await user.save();

        // Create profile with Google avatar
        await Profile.create({
            userId: user._id,
            avatar: picture || "",
        });

        generateTokenandSetCookie(res, user._id);

        const populatedUser = await User.findById(user._id)
            .populate("memberships.communityId", "name slug icon")
            .lean();

        res.status(201).json({
            success: true,
            message: "Account created with Google",
            user: { ...(await withTier(populatedUser)), password: undefined },
        });
    } catch (error) {
        console.log("Error in googleAuth:", error);
        res.status(500).json({ success: false, message: error.message || "Google authentication failed" });
    }
};

// ── Sign Up ─────────────────────────────────────────────────────────────────
export const signUp = async (req, res) => {
    const { email, password, name, inviteCode } = req.body;

    try {
        if (!email || !password || !name) {
            throw new Error("All fields are required");
        }

        if (!inviteCode) {
            throw new Error("Invite code is required");
        }

        // Validate invite code
        const community = await Community.findOne({
            "inviteCodes.code": inviteCode.trim(),
            "inviteCodes.isUsed": false,
        });

        if (!community) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used invite code",
            });
        }

        const inviteEntry = community.inviteCodes.find(
            (inv) => inv.code === inviteCode.trim() && !inv.isUsed
        );

        if (!inviteEntry) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used invite code",
            });
        }

        if (inviteEntry.expiresAt && new Date(inviteEntry.expiresAt) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "This invite code has expired",
            });
        }

        const userAlreadyExist = await User.findOne({ email });
        if (userAlreadyExist) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashpassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            password: hashpassword,
            name,
            isInviteVerified: true,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });

        await user.save();

        // Mark invite code as used
        inviteEntry.isUsed = true;
        inviteEntry.usedBy = user._id;
        community.members.push(user._id);
        await community.save();

        // Add membership to user
        user.memberships.push({ communityId: community._id, role: "member" });
        await user.save();

        generateTokenandSetCookie(res, user._id);

        await sendVerificationEmail(user.email, verificationToken);

        // Re-fetch with populated memberships for the frontend
        const populatedUser = await User.findById(user._id).populate('memberships.communityId', 'name slug icon').lean();

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...(await withTier(populatedUser)),
                password: undefined,
            },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ── Login ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        generateTokenandSetCookie(res, user._id);
        user.lastLogin = new Date();
        await user.save();

        // Re-fetch with populated memberships so the frontend gets community names
        const populatedUser = await User.findById(user._id).populate('memberships.communityId', 'name slug icon').lean();

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: {
                ...(await withTier(populatedUser)),
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in login:", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
    try {
        let userId = req.userId;
        if (!userId) {
            const token = req.cookies?.Token;
            if (token && process.env.JWT_SECRET) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    userId = decoded?.userId;
                } catch {
                    // ignore invalid token
                }
            }
        }

        if (userId) {
            const profile = await Profile.findOneAndUpdate(
                { userId },
                { $set: { presence: "offline" } },
                { new: true }
            );

            try {
                const { io } = await import("../socket.js");
                io.to(`user:${userId}`).emit("profile:updated", {
                    userId,
                    presence: "offline",
                    bio: profile?.bio,
                    displayName: profile?.displayName,
                    avatar: profile?.avatar,
                });
                io.emit("presence:update", {
                    userId,
                    presence: "offline",
                    bio: profile?.bio,
                    displayName: profile?.displayName,
                    avatar: profile?.avatar,
                });
            } catch {
                // ignore socket errors
            }
        }
    } catch {
        // best effort
    }

    res.clearCookie("Token");
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

// ── Verify Email ────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
    const { code } = req.body;

    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...(await withTier(user._doc)),
                password: undefined,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ── Forgot Password ─────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
            });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;
        await user.save();

        await sendResetPasswordEmail(
            user.email,
            `${process.env.CLIENT_URL}/reset-password/${resetToken}`
        );

        res.status(200).json({
            success: true,
            message: "Password reset link sent to your email",
        });
    } catch (error) {
        console.log("Error in forgotPassword:", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ── Reset Password ──────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        const hashpassword = await bcrypt.hash(password, 10);

        user.password = hashpassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        await sendResetSuccessEmail(user.email);

        res.status(200).json({
            success: true,
            message: "Password reset successful",
        });
    } catch (error) {
        console.log("Error in resetPassword:", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ── Check Auth ──────────────────────────────────────────────────────────────
export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('memberships.communityId', 'name slug icon');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: {
                ...(await withTier(user._doc)),
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in checkAuth:", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
