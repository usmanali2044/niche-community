import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";

// ── Search across Posts & Profiles ──────────────────────────────────────────
export const search = async (req, res) => {
    try {
        const q = (req.query.q || "").trim();

        if (q.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Search query must be at least 2 characters",
            });
        }

        // Escape regex special chars for safety
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");

        // Run both searches in parallel
        const [posts, users] = await Promise.all([
            // Posts matching content
            Post.find({ content: regex, communityId: req.communityId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("authorId", "name email")
                .lean(),

            // Users matching name
            User.find({ name: regex })
                .select("name email")
                .limit(10)
                .lean(),
        ]);

        // Enrich posts with author avatar
        const postAuthorIds = [...new Set(posts.map((p) => p.authorId._id.toString()))];
        const postProfiles = await Profile.find({ userId: { $in: postAuthorIds } }).lean();
        const postProfileMap = {};
        postProfiles.forEach((p) => { postProfileMap[p.userId.toString()] = p; });

        const enrichedPosts = posts.map((post) => ({
            _id: post._id,
            content: post.content,
            createdAt: post.createdAt,
            author: {
                _id: post.authorId._id,
                name: post.authorId.name,
                email: post.authorId.email,
                avatar: postProfileMap[post.authorId._id.toString()]?.avatar || "",
            },
        }));

        // Enrich users with avatar
        const userIds = users.map((u) => u._id.toString());
        const userProfiles = await Profile.find({ userId: { $in: userIds } }).lean();
        const userProfileMap = {};
        userProfiles.forEach((p) => { userProfileMap[p.userId.toString()] = p; });

        const enrichedUsers = users.map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            avatar: userProfileMap[u._id.toString()]?.avatar || "",
        }));

        res.status(200).json({
            success: true,
            posts: enrichedPosts,
            users: enrichedUsers,
        });
    } catch (error) {
        console.log("Error in search:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
