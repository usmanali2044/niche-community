import mongoose from "mongoose";

const channelMessageCommentSchema = new mongoose.Schema({
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: "ChannelMessage", required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } });

channelMessageCommentSchema.index({ messageId: 1, createdAt: 1 });

export default mongoose.model("ChannelMessageComment", channelMessageCommentSchema);
