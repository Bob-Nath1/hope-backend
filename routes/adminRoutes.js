// backend/routes/adminRoute.js
import express from "express";
import {
  getAllUsers,
  getAllInvestments,
  getAllLoans,
  approveLoan,
  rejectLoan,
  approveInvestment,
  getAdminStats,
  suspendUser,
  deactivateUser,
  activateUser,
  updateUserRole,
  sendNotification,
  getUserById,
  getAllContributions,
  createContribution,
  approveContribution,
  deleteUser,
  getAllReports,
} from "../controllers/adminController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin dashboard stats
router.get("/stats", verifyToken, verifyAdmin, getAdminStats);

router.post("/contributions", verifyToken, createContribution);

// Users routes
router.get("/users", verifyToken, verifyAdmin, getAllUsers);
router.get("/users/:id", verifyToken, verifyAdmin, getUserById);
router.delete("/users/:id", verifyToken, verifyAdmin, deleteUser);
router.patch("/users/suspend/:id", verifyToken, verifyAdmin, suspendUser);
router.patch("/users/deactivate/:id", verifyToken, verifyAdmin, deactivateUser);
router.patch("/users/activate/:id", verifyToken, verifyAdmin, activateUser);
router.patch("/users/role/:id", verifyToken, verifyAdmin, updateUserRole);
router.post("/users/notify/:id", verifyToken, verifyAdmin, sendNotification);

// Investments routes
router.get("/investments", verifyToken, verifyAdmin, getAllInvestments);
router.patch("/investments/approve/:id", verifyToken, verifyAdmin, approveInvestment);

// Loans routes
router.get("/loans", verifyToken, verifyAdmin, getAllLoans);
router.patch("/loans/approve/:id", verifyToken, verifyAdmin, approveLoan);

// Add reject route
router.patch("/loans/reject/:id", rejectLoan);

// Contributions route
router.get("/contributions", verifyToken, verifyAdmin, getAllContributions);

router.patch("/contributions/approve/:id", verifyToken, verifyAdmin, approveContribution);

// Reports route (if you use it)
router.get("/reports", verifyToken, verifyAdmin, getAllReports);

export default router;
