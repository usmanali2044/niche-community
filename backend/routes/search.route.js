import express from "express";
import { search } from "../controllers/search.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyCommunityAccess } from "../middleware/verifyCommunityAccess.js";

const router = express.Router();

router.get("/", verifyToken, verifyCommunityAccess, search);

export default router;
