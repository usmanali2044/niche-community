import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["mention", "reply", "event", "warning", "admin", "moderator", "friend"], required: true },
  readAt: { type: Date, default: null },
  meta: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// Efficient queries: unread-first, newest-first
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
