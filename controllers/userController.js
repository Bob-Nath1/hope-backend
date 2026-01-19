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

