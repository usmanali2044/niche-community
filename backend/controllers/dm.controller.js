import DmThread from "../models/dmThread.model.js";
import DmMessage from "../models/dmMessage.model.js";

// Ensure a thread exists between two users
const getOrCreateThread = async (userId, otherId) => {
    let thread = await DmThread.findOne({
        participants: { $all: [userId, otherId] },
    });
    if (!thread) {
        thread = await DmThread.create({ participants: [userId, otherId] });
    }
    return thread;
};

export const getThread = async (req, res) => {
    try {
        const { userId } = req.params;
        const thread = await getOrCreateThread(req.userId, userId);
        res.status(200).json({ success: true, threadId: thread._id });
    } catch (error) {
        console.log("Error in getThread:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { threadId } = req.params;
        const messages = await DmMessage.find({ threadId }).sort({ createdAt: 1 }).lean();
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.log("Error in getMessages:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { content, mediaURLs } = req.body;
        if ((!content || !content.trim()) && (!mediaURLs || mediaURLs.length === 0)) {
            return res.status(400).json({ success: false, message: "Message or media is required" });
        }
        const message = await DmMessage.create({
            threadId,
            senderId: req.userId,
            content: content?.trim() || "",
            mediaURLs: mediaURLs || [],
        });
        await DmThread.findByIdAndUpdate(threadId, { lastMessageAt: new Date() });

        res.status(201).json({ success: true, message });

        try {
            const { io } = await import("../socket.js");
            io.to(`dm:${threadId}`).emit("dm:message", message);
        } catch { }
    } catch (error) {
        console.log("Error in sendMessage:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
