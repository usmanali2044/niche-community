import mongoose from "mongoose";

const dmThreadSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  isGroup: { type: Boolean, default: false },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

dmThreadSchema.index({ participants: 1 });

export default mongoose.model("DmThread", dmThreadSchema);
