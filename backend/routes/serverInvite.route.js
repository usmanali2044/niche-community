import express from "express";
import { getMyServerInvites, acceptServerInvite, declineServerInvite } from "../controllers/serverInvite.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getMyServerInvites);
router.post("/:id/accept", verifyToken, acceptServerInvite);
router.post("/:id/decline", verifyToken, declineServerInvite);

export default router;
