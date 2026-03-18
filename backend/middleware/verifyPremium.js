import Channel from "../models/channel.model.js";
import Profile from "../models/profile.model.js";

const PREMIUM_TIERS = new Set(["premium", "enterprise"]);

export const verifyPremium = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ userId: req.userId }).select("tier").lean();
        const tier = profile?.tier || "free";

        if (!PREMIUM_TIERS.has(tier)) {
            return res.status(403).json({
                success: false,
                code: "PREMIUM_REQUIRED",
                message: "This feature requires a Premium membership",
            });
        }

        req.userTier = tier;
        return next();
    } catch (error) {
        console.log("Error in verifyPremium middleware:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Applies premium checks only when the target channel is marked as premium.
export const requirePremiumForChannel = async (req, res, next) => {
    try {
        const channelId =
            req.params?.id ||
            req.params?.channelId ||
            req.query?.channelId ||
            req.body?.channelId;
        if (!channelId) return next();

        const channel = await Channel.findOne({
            _id: channelId,
            communityId: req.communityId,
        }).select("name isPremium").lean();

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found in this community",
            });
        }

        req.targetChannel = channel;
        if (!channel.isPremium) return next();

        return verifyPremium(req, res, next);
    } catch (error) {
        console.log("Error in requirePremiumForChannel middleware:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
