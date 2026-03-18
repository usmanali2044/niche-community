import Channel from "../models/channel.model.js";
import Community from "../models/community.model.js";
import ChannelMessage from "../models/channelMessage.model.js";
import ChannelMessageComment from "../models/channelMessageComment.model.js";
import Post from "../models/post.model.js";

const resolveRolePermissions = async (req) => {
    const roleIds = req.communityMembership?.roles || [];
    if (!roleIds.length) return {};
    const community = await Community.findById(req.communityId).select("roles").lean();
    if (!community) return {};
    const roleMap = new Map((community.roles || []).map((r) => [r._id.toString(), r.permissions || {}]));
    return roleIds.reduce((acc, roleId) => {
        const perms = roleMap.get(roleId?.toString?.() || String(roleId));
        if (!perms) return acc;
        Object.keys(perms).forEach((key) => {
            if (perms[key]) acc[key] = true;
        });
        return acc;
    }, {});
};

// ── Get all channels ────────────────────────────────────────────────────────
export const getChannels = async (req, res) => {
    try {
        const channels = await Channel.find({ communityId: req.communityId }).sort({ createdAt: 1 }).lean();
        res.status(200).json({ success: true, channels });
    } catch (error) {
        console.log("Error in getChannels:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Create channel (Admin/Moderator only) ───────────────────────────────────
export const createChannel = async (req, res) => {
    try {
        const rolePermissions = await resolveRolePermissions(req);
        const canCreateChannel =
            ["admin", "moderator"].includes(req.communityRole) ||
            rolePermissions.createChannels ||
            rolePermissions.manageChannels;
        if (!canCreateChannel) {
            return res.status(403).json({
                success: false,
                message: "Only admins or moderators can create channels",
            });
        }

        const { name, description, isPrivate, isPremium, type } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Channel name is required",
            });
        }

        // Normalize: lowercase, trim, replace spaces with hyphens
        const normalizedName = name.trim().toLowerCase().replace(/\s+/g, "-");

        // Check for duplicates
        const existing = await Channel.findOne({
            communityId: req.communityId,
            name: normalizedName,
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: `Channel #${normalizedName} already exists`,
            });
        }

        const channel = await Channel.create({
            communityId: req.communityId,
            name: normalizedName,
            description: (description || "").trim(),
            type: ["text", "voice", "forum", "announcement"].includes(type) ? type : "text",
            isPrivate: isPrivate || false,
            isPremium: isPremium || false,
        });

        res.status(201).json({
            success: true,
            message: "Channel created",
            channel,
        });
    } catch (error) {
        console.log("Error in createChannel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Join channel (premium channels require premium tier middleware) ────────
export const joinChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const channel = req.targetChannel || await Channel.findOne({
            _id: id,
            communityId: req.communityId,
        }).lean();

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Channel access granted",
            channel,
        });
    } catch (error) {
        console.log("Error in joinChannel:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Update channel name (Admin/Moderator or manageChannels) ─────────────────
export const updateChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const rolePermissions = await resolveRolePermissions(req);
        const canManage =
            ["admin", "moderator"].includes(req.communityRole) ||
            rolePermissions.manageChannels;

        if (!canManage) {
            return res.status(403).json({
                success: false,
                message: "Only admins, moderators, or members with channel permissions can edit channels",
            });
        }

        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Channel name is required",
            });
        }

        const normalizedName = name.trim().toLowerCase().replace(/\s+/g, "-");

        const existing = await Channel.findOne({
            communityId: req.communityId,
            name: normalizedName,
            _id: { $ne: id },
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: `Channel #${normalizedName} already exists`,
            });
        }

        const channel = await Channel.findOneAndUpdate(
            { _id: id, communityId: req.communityId },
            { name: normalizedName },
            { new: true }
        );

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found",
            });
        }

        res.status(200).json({ success: true, channel });
    } catch (error) {
        console.log("Error in updateChannel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Delete channel (Admin/Moderator or manageChannels) ──────────────────────
export const deleteChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const rolePermissions = await resolveRolePermissions(req);
        const canManage =
            ["admin", "moderator"].includes(req.communityRole) ||
            rolePermissions.manageChannels;

        if (!canManage) {
            return res.status(403).json({
                success: false,
                message: "Only admins, moderators, or members with channel permissions can delete channels",
            });
        }

        const channel = await Channel.findOne({ _id: id, communityId: req.communityId }).lean();
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found",
            });
        }

        const messageIds = await ChannelMessage.find({ channelId: id }).select("_id").lean();
        if (messageIds.length > 0) {
            await ChannelMessageComment.deleteMany({ messageId: { $in: messageIds.map((m) => m._id) } });
            await ChannelMessage.deleteMany({ channelId: id });
        }

        await Post.updateMany({ channelId: id }, { $set: { channelId: null } });
        await Channel.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Channel deleted", channelId: id });
    } catch (error) {
        console.log("Error in deleteChannel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
