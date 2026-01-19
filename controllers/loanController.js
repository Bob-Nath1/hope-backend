// backend/controllers/loanController.js
import { db } from "../db.js";
import * as schema from "../drizzle/schema.js";

export const applyForLoan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, reason, duration } = req.body;

    if (!amount || !duration) {
      return res.status(400).json({ success: false, message: "Amount and duration are required" });
    }

    const [loan] = await db
      .insert(schema.loan)
      .values({
        amount: parseFloat(amount),
        reason: reason || null,
        duration: parseInt(duration),
        userId,
        status: "pending",
        date: new Date(),
      })
      .returning();

    res.json({
      success: true,
      message: "Loan application submitted",
      data: loan,
    });
  } catch (error) {
    console.error("Loan Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
