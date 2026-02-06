// backend/routes/userRoutes.js
import express from "express";
import { verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import { db } from "../db.js";
import * as schema from "../drizzle/schema.js";
import { investment, loan, notification } from "../drizzle/schema.js";
import { eq, desc } from "drizzle-orm";
import { getFinancialSummary } from "../controllers/userController.js";




const router = express.Router();

router.use(verifyToken);
router.use(verifyUser);



/* =====================================================
   USER PROFILE ROUTES (NEW)
===================================================== */

// GET USER PROFILE
router.get("/profile", async (req, res) => {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, req.user.id));

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(foundUser);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




/* =====================================================
   USER PROFILE ROUTES (NEW)
===================================================== */

// GET USER PROFILE
router.get("/profile", async (req, res) => {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, req.user.id));

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(foundUser);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});






// CREATE INVESTMENT
router.post("/investment", async (req, res) => {
  try {
    const userId = req.user.id;
    const { planName, amount, duration, expectedReturn, paymentMethod } = req.body;

    if (!planName || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [newInvestment] = await db
      .insert(investment)
      .values({
        userId,
        projectName: planName,
        amount: Number(amount),
        returns: Number(expectedReturn?.replace(/[^0-9.-]+/g, "")) || 0,
        startDate: new Date(),
        status: "pending",
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Investment submitted! Waiting for admin approval.",
      data: newInvestment,
    });
  } catch (err) {
    console.error("Investment error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE LOAN APPLICATION
router.post("/loan/apply", async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, reason, duration } = req.body;

    if (!amount || !reason || !duration) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [newLoan] = await db
      .insert(loan)
      .values({
        userId,
        amount: Number(amount),
        purpose: reason,
        duration: Number(duration),
        status: "pending",
        date: new Date(),
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Loan application submitted successfully!",
      data: newLoan,
    });
  } catch (err) {
    console.error("Loan apply error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit Report
router.post("/report", async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, message } = req.body;

    const [report] = await db
      .insert(schema.report)
      .values({
        userId,
        title,
        content: message,
        status: "pending",
        createdat: new Date(),
      })
      .returning();

      

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// APPROVE LOAN
router.patch("/loans/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(loan)
      .set({ status: "approved" })
      .where(eq(loan.id, Number(id)))
      .returning();

    if (!updated) return res.status(404).json({ message: "Loan not found" });

    // Send notification
    await db.insert(notification).values({
      userid: updated.userId,
      title: "Loan Approved!",
      message: `Your ₦${Number(updated.amount).toLocaleString()} loan has been approved!`,
      isread: false,
    });

    res.json({ success: true, message: "Loan approved & user notified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// REJECT LOAN
router.patch("/loans/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(loan)
      .set({ status: "rejected" })
      .where(eq(loan.id, Number(id)))
      .returning();

    if (!updated) return res.status(404).json({ message: "Loan not found" });

    // Send rejection notification
    await db.insert(notification).values({
      userid: updated.userId,
      title: "Loan Rejected",
      message: `We're sorry, your ₦${Number(updated.amount).toLocaleString()} loan application has been rejected.`,
      isread: false,
    });

    res.json({ success: true, message: "Loan rejected & user notified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// GET NOTIFICATIONS
router.get("/notifications", async (req, res) => {
  try {
    const notifs = await db
      .select()
      .from(notification)
      .where(eq(notification.userid, req.user.id))
      .orderBy(desc(notification.createdat));
    res.json(notifs);
  } catch (err) {
    console.error("Notification fetch error:", err);
    res.status(500).json([]);
  }
});

// MARK NOTIFICATION AS READ
router.patch("/notifications/read/:id", async (req, res) => {
  try {
    await db
      .update(notification)
      .set({ isread: true })
      .where(eq(notification.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.get("/financial-summary", verifyToken, getFinancialSummary);

export default router;
