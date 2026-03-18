import User from "../models/user.model.js";

const presenceFromLastLogin = (profilePresence, lastLogin) => {
    if (["online", "idle", "dnd", "offline"].includes(profilePresence)) return profilePresence;
    if (!lastLogin) return "offline";
    const now = Date.now();
    const diff = now - new Date(lastLogin).getTime();
    if (diff <= 10 * 60 * 1000) return "online";
    if (diff <= 60 * 60 * 1000) return "idle";
    return "offline";
};

const shapeUser = (u) => {
    const displayName = u.profileId?.displayName || u.name || "Member";
    const username = u.email ? u.email.split("@")[0] : (u.name || "user").toLowerCase();
    const presence = presenceFromLastLogin(u.profileId?.presence, u.lastLogin);
    const statusText = u.profileId?.status || "Eat Sleep Code Repeat";
    return {
        _id: u._id,
        displayName,
        username,
        presence,
        statusText,
        avatar: u.profileId?.avatar || "",
        tier: u.profileId?.tier || "free",
    };
};

// ── GET /friends ────────────────────────────────────────────────────────────
export const listFriends = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate({
                path: "friends",
                select: "name email lastLogin profileId",
                populate: { path: "profileId", select: "avatar displayName status presence tier" },
            })
            .lean();

        const friends = (user?.friends || []).map(shapeUser);
        const onlineCount = friends.filter((f) => f.presence !== "offline").length;

        res.status(200).json({ success: true, friends, onlineCount });
    } catch (error) {
        console.log("Error in listFriends:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── GET /friends/requests ───────────────────────────────────────────────────
export const listRequests = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("friendRequests")
            .lean();

        const incomingIds = user?.friendRequests?.incoming?.map((r) => r.userId) || [];
        const outgoingIds = user?.friendRequests?.outgoing?.map((r) => r.userId) || [];

        const [incoming, outgoing] = await Promise.all([
            User.find({ _id: { $in: incomingIds } })
                .select("name email lastLogin profileId")
                .populate("profileId", "avatar displayName status presence tier")
                .lean(),
            User.find({ _id: { $in: outgoingIds } })
                .select("name email lastLogin profileId")
                .populate("profileId", "avatar displayName status presence tier")
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            incoming: incoming.map(shapeUser),
            outgoing: outgoing.map(shapeUser),
        });
    } catch (error) {
        console.log("Error in listRequests:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /friends/request ───────────────────────────────────────────────────
export const sendRequest = async (req, res) => {
    try {
        const { targetId } = req.body;
        if (!targetId) return res.status(400).json({ success: false, message: "targetId is required" });
        if (targetId === req.userId) return res.status(400).json({ success: false, message: "You cannot add yourself" });

        const [sender, target] = await Promise.all([
            User.findById(req.userId).select("friends friendRequests").lean(),
            User.findById(targetId).select("friends friendRequests").lean(),
        ]);

        if (!target) return res.status(404).json({ success: false, message: "User not found" });

        const alreadyFriends = sender?.friends?.some((id) => id.toString() === targetId);
        if (alreadyFriends) return res.status(400).json({ success: false, message: "Already friends" });

        const outgoingExists = sender?.friendRequests?.outgoing?.some((r) => r.userId.toString() === targetId);
        if (outgoingExists) return res.status(400).json({ success: false, message: "Request already sent" });

        const incomingExists = sender?.friendRequests?.incoming?.some((r) => r.userId.toString() === targetId);
        if (incomingExists) {
            await Promise.all([
                User.findByIdAndUpdate(req.userId, {
                    $pull: { "friendRequests.incoming": { userId: targetId } },
                    $addToSet: { friends: targetId },
                }),
                User.findByIdAndUpdate(targetId, {
                    $pull: { "friendRequests.outgoing": { userId: req.userId } },
                    $addToSet: { friends: req.userId },
                }),
            ]);
            return res.status(200).json({ success: true, message: "Friend request accepted" });
        }

        await Promise.all([
            User.findByIdAndUpdate(req.userId, {
                $addToSet: { "friendRequests.outgoing": { userId: targetId } },
            }),
            User.findByIdAndUpdate(targetId, {
                $addToSet: { "friendRequests.incoming": { userId: req.userId } },
            }),
        ]);

        res.status(200).json({ success: true, message: "Friend request sent" });

        // Realtime notify both users
        try {
            const { io } = await import("../socket.js");
            io.to(`user:${targetId}`).emit("friends:requests:update", { userId: targetId });
            io.to(`user:${req.userId}`).emit("friends:requests:update", { userId: req.userId });
        } catch { }
    } catch (error) {
        console.log("Error in sendRequest:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /friends/accept ────────────────────────────────────────────────────
export const acceptRequest = async (req, res) => {
    try {
        const { requesterId } = req.body;
        if (!requesterId) return res.status(400).json({ success: false, message: "requesterId is required" });

        await Promise.all([
            User.findByIdAndUpdate(req.userId, {
                $pull: { "friendRequests.incoming": { userId: requesterId } },
                $addToSet: { friends: requesterId },
            }),
            User.findByIdAndUpdate(requesterId, {
                $pull: { "friendRequests.outgoing": { userId: req.userId } },
                $addToSet: { friends: req.userId },
            }),
        ]);

        res.status(200).json({ success: true, message: "Friend request accepted" });

        // Realtime notify both users
        try {
            const { io } = await import("../socket.js");
            io.to(`user:${requesterId}`).emit("friends:updated", { userId: requesterId });
            io.to(`user:${req.userId}`).emit("friends:updated", { userId: req.userId });
            io.to(`user:${requesterId}`).emit("friends:requests:update", { userId: requesterId });
            io.to(`user:${req.userId}`).emit("friends:requests:update", { userId: req.userId });
        } catch { }
    } catch (error) {
        console.log("Error in acceptRequest:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /friends/decline ───────────────────────────────────────────────────
export const declineRequest = async (req, res) => {
    try {
        const { requesterId } = req.body;
        if (!requesterId) return res.status(400).json({ success: false, message: "requesterId is required" });

        await Promise.all([
            User.findByIdAndUpdate(req.userId, {
                $pull: { "friendRequests.incoming": { userId: requesterId } },
            }),
            User.findByIdAndUpdate(requesterId, {
                $pull: { "friendRequests.outgoing": { userId: req.userId } },
            }),
        ]);

        res.status(200).json({ success: true, message: "Friend request declined" });

        // Realtime notify both users
        try {
            const { io } = await import("../socket.js");
            io.to(`user:${requesterId}`).emit("friends:requests:update", { userId: requesterId });
            io.to(`user:${req.userId}`).emit("friends:requests:update", { userId: req.userId });
        } catch { }
    } catch (error) {
        console.log("Error in declineRequest:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /friends/remove ───────────────────────────────────────────────────
export const removeFriend = async (req, res) => {
    try {
        const { targetId } = req.body;
        if (!targetId) return res.status(400).json({ success: false, message: "targetId is required" });
        if (targetId === req.userId) return res.status(400).json({ success: false, message: "You cannot remove yourself" });

        const target = await User.findById(targetId).select("_id").lean();
        if (!target) return res.status(404).json({ success: false, message: "User not found" });

        await Promise.all([
            User.findByIdAndUpdate(req.userId, {
                $pull: {
                    friends: targetId,
                    "friendRequests.incoming": { userId: targetId },
                    "friendRequests.outgoing": { userId: targetId },
                },
            }),
            User.findByIdAndUpdate(targetId, {
                $pull: {
                    friends: req.userId,
                    "friendRequests.incoming": { userId: req.userId },
                    "friendRequests.outgoing": { userId: req.userId },
                },
            }),
        ]);

        res.status(200).json({ success: true, message: "Friend removed" });

        try {
            const { io } = await import("../socket.js");
            io.to(`user:${targetId}`).emit("friends:updated", { userId: targetId });
            io.to(`user:${req.userId}`).emit("friends:updated", { userId: req.userId });
            io.to(`user:${targetId}`).emit("friends:requests:update", { userId: targetId });
            io.to(`user:${req.userId}`).emit("friends:requests:update", { userId: req.userId });
        } catch { }
    } catch (error) {
        console.log("Error in removeFriend:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
