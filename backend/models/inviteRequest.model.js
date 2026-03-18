import mongoose from "mongoose";

const inviteRequestSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requesterName: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  message: { type: String, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  respondedAt: { type: Date, default: null },
  inviteCode: { type: String, default: "" },
}, { timestamps: true });

inviteRequestSchema.index({ communityId: 1, status: 1, createdAt: -1 });
inviteRequestSchema.index({ requesterId: 1, communityId: 1, status: 1 });

export default mongoose.model("InviteRequest", inviteRequestSchema);
