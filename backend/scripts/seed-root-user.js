import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

const requiredEnv = ["MONGO_URI", "ROOT_ADMIN_NAME", "ROOT_ADMIN_EMAIL", "ROOT_ADMIN_PASSWORD"];
const missing = requiredEnv.filter((key) => !process.env[key] || !String(process.env[key]).trim());

if (missing.length > 0) {
  console.error(`Missing required env values: ${missing.join(", ")}`);
  process.exit(1);
}

const ROOT_USER = {
  name: process.env.ROOT_ADMIN_NAME.trim(),
  email: process.env.ROOT_ADMIN_EMAIL.trim().toLowerCase(),
  password: process.env.ROOT_ADMIN_PASSWORD,
  role: "admin",
  isVerified: true,
  isInviteVerified: true,
};

const ensureProfile = async (userId) => {
  let profile = await Profile.findOne({ userId });
  if (!profile) {
    profile = await Profile.create({ userId });
  }
  await User.findByIdAndUpdate(userId, { profileId: profile._id });
  return profile;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

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

      console.log("Root user already exists. Synced role/flags/profile.");
      console.log(`Email: ${existing.email}`);
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(ROOT_USER.password, 10);
    const user = await User.create({
      ...ROOT_USER,
      password: hashedPassword,
    });

    await ensureProfile(user._id);

    console.log("Root user created successfully.");
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`User ID: ${user._id}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to seed root user:", error.message);
    process.exit(1);
  }
};

run();
