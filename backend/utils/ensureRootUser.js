import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";

const requiredEnv = ["ROOT_ADMIN_NAME", "ROOT_ADMIN_EMAIL", "ROOT_ADMIN_PASSWORD"];

const buildRootUser = () => ({
    name: process.env.ROOT_ADMIN_NAME.trim(),
    email: process.env.ROOT_ADMIN_EMAIL.trim().toLowerCase(),
    password: process.env.ROOT_ADMIN_PASSWORD,
    role: "admin",
    isVerified: true,
    isInviteVerified: true,
});

const ensureProfile = async (userId) => {
    let profile = await Profile.findOne({ userId });
    if (!profile) {
        profile = await Profile.create({ userId });
    }
    await User.findByIdAndUpdate(userId, { profileId: profile._id });
    return profile;
};

export const ensureRootUser = async () => {
    const missing = requiredEnv.filter((key) => !process.env[key] || !String(process.env[key]).trim());
    if (missing.length > 0) {
        console.log(`⚠️  Root user seed skipped. Missing env: ${missing.join(", ")}`);
        return { skipped: true, missing };
    }

    const ROOT_USER = buildRootUser();

    const existing = await User.findOne({ email: ROOT_USER.email });
    if (existing) {
        let changed = false;
        if (existing.name !== ROOT_USER.name) {
            existing.name = ROOT_USER.name;
            changed = true;
        }
        if (existing.role !== "admin") {
            existing.role = "admin";
            changed = true;
        }
        if (!existing.isVerified) {
            existing.isVerified = true;
            changed = true;
        }
        if (!existing.isInviteVerified) {
            existing.isInviteVerified = true;
            changed = true;
        }
        if (changed) {
            await existing.save();
        }
        await ensureProfile(existing._id);
        console.log("✅ Root user already exists. Synced role/flags/profile.");
        return { created: false, userId: existing._id };
    }

    const hashedPassword = await bcrypt.hash(ROOT_USER.password, 10);
    const user = await User.create({
        ...ROOT_USER,
        password: hashedPassword,
    });
    await ensureProfile(user._id);
    console.log("✅ Root user created on startup.");
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    return { created: true, userId: user._id };
};
