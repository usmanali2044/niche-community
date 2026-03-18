import express from "express";
import upload from "../middleware/upload.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/upload — upload a single file, return Cloudinary URL
router.post("/", verifyToken, upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }

        // multer-storage-cloudinary v2 passes the raw Cloudinary response as req.file.
        // The URL lives in `secure_url` (not `path`).
        const url = req.file.secure_url || req.file.path || req.file.url;

        if (!url) {
            console.log("⚠️  Upload completed but no URL found. req.file keys:", Object.keys(req.file));
            return res.status(500).json({ success: false, message: "Upload succeeded but URL missing" });
        }

        res.status(200).json({ success: true, url });
    } catch (error) {
        console.log("Error in upload route:", error);
        res.status(500).json({ success: false, message: "Upload failed" });
    }
});

export default router;
