import ServerInvite from "../models/serverInvite.model.js";
import Community from "../models/community.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { io } from "../socket.js";

const shapeInvite = (invite) => {
    const community = invite.communityId || {};
    const inviter = invite.inviterId || {};
    return {
        _id: invite._id,
        status: invite.status,
        createdAt: invite.createdAt,
        respondedAt: invite.respondedAt || null,
        community: community?._id ? {
            _id: community._id,
            name: community.name,
            slug: community.slug,
            icon: community.icon || "",
        } : null,
        inviter: inviter?._id ? {
            _id: inviter._id,
            name: inviter.name || "Admin",
        } : null,
    };
};

// ── POST /communities/:id/invites/direct ─────────────────────────────────────
export const sendServerInvite = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        if (id !== req.communityId) {
            return res.status(403).json({ success: false, message: "Community ID mismatch" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        if (userId.toString() === req.userId.toString()) {
            return res.status(400).json({ success: false, message: "You cannot invite yourself" });
        }

        const [community, inviter, invitee] = await Promise.all([
            Community.findById(id).select("name slug icon").lean(),
            User.findById(req.userId).select("name").lean(),
            User.findById(userId).select("memberships").lean(),
        ]);

        if (!community) {
            return res.status(404).json({ success: false, message: "Community not found" });
        }

        if (!invitee) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const alreadyMember = (invitee.memberships || []).some(
            (m) => m.communityId?.toString?.() === id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({ success: false, message: "User is already a member" });
        }

        const existing = await ServerInvite.findOne({
            communityId: id,
            inviteeId: userId,
            status: "pending",
        }).lean();

        if (existing) {
            return res.status(409).json({ success: false, message: "Invite already sent" });
        }

        const invite = await ServerInvite.create({
            communityId: id,
            inviterId: req.userId,
            inviteeId: userId,
        });

        try {
            const notification = await Notification.create({
                userId,
                type: "admin",
                meta: {
                    action: "server_invite",
                    communityId: community._id,
                    communityName: community.name,
                    communityIcon: community.icon || "",
                    inviterId: req.userId,
                    inviterName: inviter?.name || "Admin",
                    inviteId: invite._id,
                },
            });
            io.to(`user:${userId}`).emit("new_notification", notification);
        } catch (notifErr) {
            console.log("⚠️  Failed to create server invite notification:", notifErr);
        }

        res.status(201).json({
            success: true,
            message: "Invite sent successfully",
            invite,
        });
    } catch (error) {
        console.log("Error in sendServerInvite:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── GET /server-invites ─────────────────────────────────────────────────────
export const getMyServerInvites = async (req, res) => {
    try {
        const invites = await ServerInvite.find({ inviteeId: req.userId, status: "pending" })
            .sort({ createdAt: -1 })
            .populate("communityId", "name slug icon")
            .populate("inviterId", "name")
            .lean();

        res.status(200).json({
            success: true,
            invites: invites.map(shapeInvite),
        });
    } catch (error) {
        console.log("Error in getMyServerInvites:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /server-invites/:id/accept ─────────────────────────────────────────
export const acceptServerInvite = async (req, res) => {
    const { id } = req.params;

    try {
        const invite = await ServerInvite.findOne({ _id: id, inviteeId: req.userId });
        if (!invite) {
            return res.status(404).json({ success: false, message: "Invite not found" });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({ success: false, message: "Invite already resolved" });
        }

        const [community, user] = await Promise.all([
            Community.findById(invite.communityId),
            User.findById(req.userId),
        ]);

        if (!community) {
            return res.status(404).json({ success: false, message: "Community not found" });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const alreadyMember = (user.memberships || []).some(
            (m) => m.communityId?.toString?.() === community._id.toString()
        );

        if (!alreadyMember) {
            community.members.addToSet(user._id);
            await community.save();
            user.memberships.push({ communityId: community._id, role: "member" });
            await user.save();
        }

        invite.status = "accepted";
        invite.respondedAt = new Date();
        await invite.save();

        const populatedUser = await User.findById(user._id)
            .populate("memberships.communityId", "name slug icon")
            .lean();

        io.to(`user:${user._id}`).emit("community:member_added", {
            community: {
                _id: community._id,
                name: community.name,
                slug: community.slug,
                icon: community.icon || "",
            },
            role: "member",
        });

        res.status(200).json({
            success: true,
            message: alreadyMember ? "You are already a member" : `You've joined ${community.name}!`,
            invite: invite.toObject(),
            community: { _id: community._id, name: community.name, slug: community.slug, icon: community.icon || "" },
            user: { ...populatedUser, password: undefined },
        });
    } catch (error) {
        console.log("Error in acceptServerInvite:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /server-invites/:id/decline ────────────────────────────────────────
export const declineServerInvite = async (req, res) => {
    const { id } = req.params;

    try {
        const invite = await ServerInvite.findOne({ _id: id, inviteeId: req.userId });
        if (!invite) {
            return res.status(404).json({ success: false, message: "Invite not found" });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({ success: false, message: "Invite already resolved" });
        }

        invite.status = "declined";
        invite.respondedAt = new Date();
        await invite.save();

        res.status(200).json({ success: true, invite: invite.toObject() });
    } catch (error) {
        console.log("Error in declineServerInvite:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
