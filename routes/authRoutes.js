// backend/routes/authRoutes.js
import express from "express";
import {
  upload,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getDashboardStats,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "idDocument", maxCount: 1 }
  ]),
  registerUser
);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/dashboard-stats", verifyToken, getDashboardStats);

export default router;
