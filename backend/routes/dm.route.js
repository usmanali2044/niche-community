import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getThread, getMessages, sendMessage } from "../controllers/dm.controller.js";

const router = express.Router();

router.get("/thread/:userId", verifyToken, getThread);
router.get("/messages/:threadId", verifyToken, getMessages);
router.post("/messages/:threadId", verifyToken, sendMessage);

export default router;
