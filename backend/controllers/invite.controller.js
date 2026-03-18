import Community from "../models/community.model.js";
import User from "../models/user.model.js";

// ── Validate Invite Code (public — no auth required) ────────────────────────
export const validateInvite = async (req, res) => {
    const { code } = req.body;

    try {
        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invite code is required",
            });
        }

        const community = await Community.findOne({
            "inviteCodes.code": code.trim(),
            "inviteCodes.isUsed": false,
        });

        if (!community) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used invite code",
            });
        }

        const inviteEntry = community.inviteCodes.find(
            (inv) => inv.code === code.trim() && !inv.isUsed
        );

        if (!inviteEntry) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used invite code",
            });
        }

        // Check expiration
        if (inviteEntry.expiresAt && new Date(inviteEntry.expiresAt) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "This invite code has expired",
            });
        }

        res.status(200).json({
            success: true,
            message: "Invite code is valid! You can now create your account.",
        });
    } catch (error) {
        console.log("Error in validateInvite:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ── Redeem Invite Code (called during signup — no auth required) ─────────────
export const redeemInvite = async (req, res) => {
    const { code } = req.body;

    try {
        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invite code is required",
            });
        }

        // Check if user already has invite access
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isInviteVerified) {
            return res.status(400).json({
                success: false,
                message: "You already have access to the platform",
            });
        }

        const community = await Community.findOne({
            "inviteCodes.code": code.trim(),
            "inviteCodes.isUsed": false,
        });

        if (!community) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used invite code",
            });
        }

        const inviteEntry = community.inviteCodes.find(
            (inv) => inv.code === code.trim() && !inv.isUsed
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

        // Mark invite as used
        inviteEntry.isUsed = true;
        inviteEntry.usedBy = req.userId;

        // Add user to community members (avoid duplicates)
        if (!community.members.includes(req.userId)) {
            community.members.push(req.userId);
        }
        await community.save();

        // Grant user access + add membership
        user.isInviteVerified = true;
        const alreadyMember = user.memberships?.some(
            (m) => m.communityId.toString() === community._id.toString()
        );
        if (!alreadyMember) {
            user.memberships.push({ communityId: community._id, role: "member" });
        }
        await user.save();

        res.status(200).json({
            success: true,
            message: "Invite code redeemed successfully!",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in redeemInvite:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
