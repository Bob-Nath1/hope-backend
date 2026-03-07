// routes/settingsRoutes.js
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

import {
  getSettings,
  updateSettings,
  requestPasswordChange,
  verifyPasswordChange,
} from "../controllers/settingsController.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getSettings);
router.put("/", updateSettings);

router.post("/change-password/request", requestPasswordChange);
router.post("/change-password/verify", verifyPasswordChange);

export default router;
