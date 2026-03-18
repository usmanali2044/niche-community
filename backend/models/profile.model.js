import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  displayName: { type: String, default: "" },
  avatar: { type: String, default: "" },
  pronouns: { type: String, default: "" },
  bannerColor: { type: String, default: "#3f4f4f" },
  status: { type: String, default: "Eat Sleep Code Repeat" },
  presence: { type: String, enum: ["online", "idle", "dnd", "offline"], default: "online" },
  bio: { type: String, default: "" },
  dataPrivacy: {
    improveData: { type: Boolean, default: true },
    personalizeActivity: { type: Boolean, default: true },
    thirdPartyPersonalization: { type: Boolean, default: true },
    personalizeExperience: { type: Boolean, default: true },
    voiceClips: { type: Boolean, default: true },
  },
  skills: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  reputation: { type: Number, default: 0 },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  tier: { type: String, enum: ["free", "premium", "enterprise"], default: "free" },
  subscriptionStatus: {
    type: String,
    enum: ["inactive", "active", "trialing", "past_due", "canceled", "unpaid"],
    default: "inactive",
  },
  isOnboarded: { type: Boolean, default: false },
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
}, { timestamps: { createdAt: "joinedAt", updatedAt: "updatedAt" } });

export default mongoose.model("Profile", profileSchema);
