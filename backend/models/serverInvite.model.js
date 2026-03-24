import mongoose from "mongoose";

const serverInviteSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
  inviterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  inviteeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  respondedAt: { type: Date, default: null },
}, { timestamps: true });

serverInviteSchema.index({ inviteeId: 1, status: 1, createdAt: -1 });
serverInviteSchema.index({ communityId: 1, inviteeId: 1, status: 1 });

export default mongoose.model("ServerInvite", serverInviteSchema);
