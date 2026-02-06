// backend/controllers/userController.js

import { db } from "../db.js";
import { investment, contribution, Withdrawal} from "../drizzle/schema.js";
import { sql, eq} from "drizzle-orm"

export const createInvestment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planName, amount, duration, expectedReturn, paymentMethod } = req.body;

    if (!planName || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Plan name, amount, and payment method are required" });
    }

    // Extract only the number from expectedReturn (e.g. "₦65,000 (30% ROI)" → 65000)
    const expectedAmount = Number(expectedReturn.replace(/[^0-9.-]+/g, "")) || 0;

    const [newInvestment] = await db
      .insert(investment)
      .values({
        userId,
        projectName: planName,
        amount: Number(amount),
        returns: expectedAmount, // ← NOW A NUMBER, not string!
        startDate: new Date(),
        endDate: null,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Investment submitted successfully! Admin will verify your payment soon.",
      data: newInvestment,
    });
  } catch (error) {
    console.error("Investment error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};


export const getFinancialSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const [contributions] = await db
      .select({ total: sql`COALESCE(SUM(${contribution.amount}), 0)` })
      .from(contribution)
      .where(eq(contribution.userId, userId));

    const [investments] = await db
      .select({ total: sql`COALESCE(SUM(${investment.amount}), 0)` })
      .from(investment)
      .where(eq(investment.userId, userId));

    const [Withdrawals] = await db
      .select({ total: sql`COALESCE(SUM(${Withdrawal.amount}), 0)` })
      .from(Withdrawal)
      .where(eq(Withdrawal.userId, userId));

    return res.json({
      success: true,
      data: {
        totalContributions: Number(contributions.total),
        totalInvestments: Number(investments.total),
        totalWithdrawals: Number(Withdrawals.total),
      },
    });
  } catch (err) {
    console.error("Financial summary error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= GET PROFILE =================
export const getUserProfile = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, req.user.id),
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE PROFILE =================
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    await db
      .update(schema.users)
      .set({ name, email, phone })
      .where(eq(schema.users.id, req.user.id));

    const updatedUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, req.user.id),
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Update failed" });
  }
};
