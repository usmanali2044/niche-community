import User from '../models/user.model.js';

export const verifyCommunityAccess = async (req, res, next) => {
    const communityId = req.headers['x-community-id'];

    if (!communityId) {
        return res.status(400).json({
            success: false,
            message: "Missing x-community-id header",
        });
    }

    try {
        const user = await User.findById(req.userId).select('memberships').lean();

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        const membership = user.memberships?.find(
            (m) => m.communityId.toString() === communityId
        );

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "Forbidden — you are not a member of this community",
            });
        }

        // ── Safety gates ──────────────────────────────────────────────────────
        if (membership.isBanned) {
            return res.status(403).json({
                success: false,
                code: "BANNED",
                message: "You have been banned from this community",
            });
        }

        if (membership.suspensionEndDate && new Date(membership.suspensionEndDate) > new Date()) {
            return res.status(403).json({
                success: false,
                code: "SUSPENDED",
                message: "Your account is temporarily suspended",
                liftAt: membership.suspensionEndDate,
            });
        }

        req.communityId = communityId;
        req.communityRole = membership.role; // "admin" | "moderator" | "member"
        req.communityMembership = membership;
        next();
    } catch (error) {
        console.log("Error in verifyCommunityAccess:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
