// routes/communityRoutes.js
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyPlanAccess } from "../middleware/planAccess.js";
import {
  getCommunityMessages,
  sendCommunityMessage,
} from "../controllers/communityController.js";

const router = express.Router();

router.get("/:plan", verifyToken, verifyPlanAccess, getCommunityMessages);
router.post("/:plan", verifyToken, verifyPlanAccess, sendCommunityMessage);

export default router;
