import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, maxlength: 2000 },
  helpfulByAuthor: { type: Boolean, default: false },
  helpfulMarkedAt: { type: Date, default: null },
}, { timestamps: true });

commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ postId: 1, helpfulByAuthor: 1 });

export default mongoose.model("Comment", commentSchema);
