import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    name: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["text", "voice", "forum", "announcement"], default: "text" },
    isPrivate: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
}, { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } });

// Each channel name must be unique within its community
channelSchema.index({ communityId: 1, name: 1 }, { unique: true });
channelSchema.index({ createdAt: 1 });

export default mongoose.model("Channel", channelSchema);
