import express from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.put("/read-all", verifyToken, markAllAsRead);
router.put("/:id/read", verifyToken, markAsRead);

export default router;
