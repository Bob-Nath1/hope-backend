import express from "express";
import { getAllWithdrawals, approveWithdrawal, rejectWithdrawal } from "../controllers/adminWithdrawalController.js";

const router = express.Router();

router.get("/", getAllWithdrawals);
router.patch("/approve/:id", approveWithdrawal);
router.patch("/reject/:id", rejectWithdrawal);

export default router;
