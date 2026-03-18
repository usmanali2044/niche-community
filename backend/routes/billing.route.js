import express from "express";
import { createCheckoutSession, verifyCheckoutSession } from "../controllers/billing.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/create-checkout-session", verifyToken, createCheckoutSession);
router.get("/verify-session", verifyToken, verifyCheckoutSession);

export default router;
