import multer from "multer";
import cloudinaryStorage from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import "../config/cloudinary.js"; // runs cloudinary.config() side-effect

const storage = cloudinaryStorage({
    cloudinary,
    params: {
        folder: "circlecore",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export default upload;
