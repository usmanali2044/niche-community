import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";

// ── Get Profile ─────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const profile = await Profile.findOne({ userId: id }).populate(
            "userId",
            "name email"
        );

        if (!profile) {
            // Return a default empty profile if none exists yet
            const user = await User.findById(id).select("name email");
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            return res.status(200).json({
                success: true,
                profile: {
                    userId: { _id: user._id, name: user.name, email: user.email },
                    displayName: "",
                    avatar: "",
                    pronouns: "",
                    bannerColor: "#3f4f4f",
                    status: "Eat Sleep Code Repeat",
                    presence: "online",
                    bio: "",
                    dataPrivacy: {
                        improveData: true,
                        personalizeActivity: true,
                        thirdPartyPersonalization: true,
                        personalizeExperience: true,
                        voiceClips: true,
                    },
                    skills: [],
                    interests: [],
                    reputation: 0,
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                    tier: "free",
                    subscriptionStatus: "inactive",
                    isOnboarded: false,
                },
            });
        }

        res.status(200).json({
            success: true,
            profile,
        });
    } catch (error) {
        console.log("Error in getProfile:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ── Update Profile ──────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { displayName, avatar, pronouns, bannerColor, status, presence, bio, skills, interests, dataPrivacy } = req.body;

        // Ensure the authenticated user can only update their own profile
        if (req.userId !== id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own profile",
            });
        }

        // Upsert — create if it doesn't exist, update if it does
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (pronouns !== undefined) updateData.pronouns = pronouns;
        if (bannerColor !== undefined) updateData.bannerColor = bannerColor;
        if (status !== undefined) updateData.status = status;
        if (presence !== undefined) updateData.presence = presence;
        if (bio !== undefined) {
            if (bio.length > 200) {
                return res.status(400).json({
                    success: false,
                    message: "Bio must be 200 characters or less",
                });
            }
            updateData.bio = bio;
        }
        if (dataPrivacy !== undefined) updateData.dataPrivacy = dataPrivacy;
        if (skills !== undefined) updateData.skills = skills;
        if (interests !== undefined) updateData.interests = interests;

        // Mark as onboarded if we have the minimum required fields
        const existingProfile = await Profile.findOne({ userId: id });
        const mergedBio = bio !== undefined ? bio : existingProfile?.bio || "";
        const mergedSkills = skills !== undefined ? skills : existingProfile?.skills || [];
        const mergedInterests = interests !== undefined ? interests : existingProfile?.interests || [];

        if (mergedBio.trim() && (mergedSkills.length > 0 || mergedInterests.length > 0)) {
            updateData.isOnboarded = true;
        }

        const profile = await Profile.findOneAndUpdate(
            { userId: id },
            { $set: updateData, $setOnInsert: { userId: id } },
            { new: true, upsert: true, runValidators: true }
        ).populate("userId", "name email");

        // Link profile to user if not already linked
        await User.findByIdAndUpdate(id, { profileId: profile._id });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile,
        });

        // Realtime presence update (best-effort)
        try {
            const { io } = await import("../socket.js");
            io.to(`user:${id}`).emit("profile:updated", {
                userId: id,
                presence: profile.presence,
                bio: profile.bio,
                displayName: profile.displayName,
                avatar: profile.avatar,
            });
            io.emit("presence:update", {
                userId: id,
                presence: profile.presence,
                bio: profile.bio,
                displayName: profile.displayName,
                avatar: profile.avatar,
            });
        } catch (e) {
            // ignore socket errors
        }
    } catch (error) {
        console.log("Error in updateProfile:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
