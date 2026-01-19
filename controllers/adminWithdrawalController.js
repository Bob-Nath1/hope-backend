import nodemailer from "nodemailer";
import { db } from "../db.js";
import { eq, desc } from "drizzle-orm";
import { Withdrawal, User, Message } from "../drizzle/schema.js";

/* ===============================
   Reusable email sender
================================ */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // ✅ lowercase
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

/* ===============================
   Fetch all withdrawals
================================ */
export const getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;

    const withdrawalsData = await db
      .select({
        id: Withdrawal.id,
        amount: Withdrawal.amount,
        status: Withdrawal.status,
        createdAt: Withdrawal.createdAt,
        userId: Withdrawal.userId,
        userName: User.name,
        userEmail: User.email,
      })
      .from(Withdrawal)
      .leftJoin(User, eq(User.id, Withdrawal.userId))
      .where(status ? eq(Withdrawal.status, status) : undefined)
      .orderBy(desc(Withdrawal.createdAt));

    res.json({ success: true, data: withdrawalsData });
  } catch (err) {
    console.error("Error fetching withdrawals:", err);
    res.status(500).json({ message: "Server error fetching withdrawals" });
  }
};

/* ===============================
   Approve withdrawal
================================ */
export const approveWithdrawal = async (req, res) => {
  try {
    const withdrawalId = Number(req.params.id);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({ message: "Invalid withdrawal ID" });
    }

    // Update withdrawal
    const [withdrawalData] = await db
      .update(Withdrawal)
      .set({ status: "approved" })
      .where(eq(Withdrawal.id, withdrawalId))
      .returning();

    if (!withdrawalData) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    // Fetch user info
    const [user] = await db
      .select()
      .from(User)
      .where(eq(User.id, withdrawalData.userId));

    // Email user
    await sendEmail({
      to: user.email,
      subject: "Withdrawal Approved",
      html: `
        <p>Hello ${user.name},</p>
        <p>Your withdrawal request of ₦${withdrawalData.amount.toLocaleString()} 
        has been <strong>approved</strong>.</p>
      `,
    });

    // In-app message
    await db.insert(Message).values({
      userId: user.id,
      content: `Your withdrawal request of ₦${withdrawalData.amount.toLocaleString()} has been approved.`,
    });

    res.json({
      message: "Withdrawal approved, user notified via email and in-app message",
      withdrawal: withdrawalData,
    });
  } catch (err) {
    console.error("Error approving withdrawal:", err);
    res.status(500).json({ message: "Server error approving withdrawal" });
  }
};

/* ===============================
   Reject withdrawal
================================ */
export const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawalId = Number(req.params.id);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({ message: "Invalid withdrawal ID" });
    }

    const [withdrawalData] = await db
      .update(Withdrawal)
      .set({ status: "rejected" })
      .where(eq(Withdrawal.id, withdrawalId))
      .returning();

    if (!withdrawalData) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    const [user] = await db
      .select()
      .from(User)
      .where(eq(User.id, withdrawalData.userId));

    await sendEmail({
      to: user.email,
      subject: "Withdrawal Rejected",
      html: `
        <p>Hello ${user.name},</p>
        <p>Your withdrawal request of ₦${withdrawalData.amount.toLocaleString()} 
        has been <strong>rejected</strong>. Please contact support.</p>
      `,
    });

    await db.insert(Message).values({
      userId: user.id,
      content: `Your withdrawal request of ₦${withdrawalData.amount.toLocaleString()} has been rejected.`,
    });

    res.json({
      message: "Withdrawal rejected, user notified via email and in-app message",
      withdrawal: withdrawalData,
    });
  } catch (err) {
    console.error("Error rejecting withdrawal:", err);
    res.status(500).json({ message: "Server error rejecting withdrawal" });
  }
};
