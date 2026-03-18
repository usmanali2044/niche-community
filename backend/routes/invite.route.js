import express from "express";
import { validateInvite, redeemInvite } from "../controllers/invite.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public — validates code without consuming it
router.post("/validate", validateInvite);

// Protected — actually consumes the code (called after signup)
router.post("/redeem", verifyToken, redeemInvite);

export default router;
