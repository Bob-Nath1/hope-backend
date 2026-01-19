// backend/controllers/adminController.js
import { db } from "../db.js";
import * as schema from "../drizzle/schema.js";
import { eq, desc, sql } from "drizzle-orm"; // <-- sql is needed for COALESCE
import nodemailer from "nodemailer";


/* -------------------------------------------------
   GET ALL USERS (admin only) - UPDATED
------------------------------------------------- */
export const getAllUsers = async (req, res) => {
  try {
    const users = await db
      .select({
        id: schema.User.id,
        name: schema.User.name,
        email: schema.User.email,
        phone: schema.User.phone,
        occupation: schema.User.occupation,
        bankName: schema.User.bankName,
        accountName: schema.User.accountName,
        accountNumber: schema.User.accountNumber,
        status: schema.User.status,
        role: schema.User.role,
        profilePicture: schema.User.profilePicture,
        createdAt: schema.User.createdAt,
        updatedAt: schema.User.updatedAt,
      })
      .from(schema.User)
      .orderBy(desc(schema.User.createdAt));

    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

/* -------------------------------------------------
   GET ALL REPORTS — SAFE WITH COALESCE
------------------------------------------------- */
export const getAllReports = async (req, res) => {
  try {
    const reports = await db
      .select({
        report: schema.report,
        user: schema.User,
      })
      .from(schema.report)
      .leftJoin(schema.User, eq(schema.User.id, schema.report.userId))
      .orderBy(desc(schema.report.createdat));

    const formatted = reports.map(r => ({
      id: r.report.id,
      userId: r.report.userId,
      title: r.report.title,
      content: r.report.content,
      status: r.report.status,
      createdat: r.report.createdat,
      userName: r.user?.name ?? "Deleted User",
      userEmail: r.user?.email ?? "no-email@deleted.com",
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("Get All Reports Error:", err);
    res.status(500).json({ message: "Server error fetching reports" });
  }
};



/* -------------------------------------------------
   GET ALL INVESTMENTS — SAFE WITH COALESCE
------------------------------------------------- */

export const getAllInvestments = async (req, res) => {
  try {
    const investments = await db
      .select({
        investmentId: schema.investment.id,
        projectName: schema.investment.projectName,
        amount: schema.investment.amount,
        status: schema.investment.status,
        startDate: schema.investment.startDate,
       memberName: sql`COALESCE(${schema.User.name}, 'Deleted User')`.as("memberName"),
memberEmail: sql`COALESCE(${schema.User.email}, 'no-email@deleted.com')`.as("memberEmail"),

      })
      .from(schema.investment)
      .leftJoin(schema.User, eq(schema.User.id, schema.investment.userId)) // <-- lowercase 'user'
      .orderBy(desc(schema.investment.startDate));

    res.json({ success: true, data: investments });
  } catch (err) {
    console.error("Get All Investments Error:", err);
    res.status(500).json({ message: "Server error fetching investments" });
  }
};



/* -------------------------------------------------
   GET ALL LOANS — SAFE WITH COALESCE
------------------------------------------------- */
export const getAllLoans = async (req, res) => {
  try {
    const loans = await db
      .select({
        loanId: schema.loan.id,
        amount: schema.loan.amount,
        status: schema.loan.status,
        appliedAt: schema.loan.date,
        purpose: schema.loan.purpose,
        duration: schema.loan.duration,
        memberName: sql`COALESCE(${schema.User.name}, 'Deleted User')`.as("memberName"),

      })
      .from(schema.loan)
      .leftJoin(schema.User, eq(schema.User.id, schema.loan.userId))
      .orderBy(desc(schema.loan.date));

    res.json({ success: true, data: loans });
  } catch (err) {
    console.error("Get All Loans Error:", err);
    res.status(500).json({ message: "Server error fetching loans" });
  }
};

/* -------------------------------------------------
   GET ALL CONTRIBUTIONS — SAFE WITH COALESCE
------------------------------------------------- */
export const getAllContributions = async (req, res) => {
  try {
    const contributions = await db
      .select({
        contributionId: schema.contribution.id,
        amount: schema.contribution.amount,
        status: schema.contribution.status,
        createdAt: schema.contribution.createdAt,
        memberName: sql`
          COALESCE(${schema.User.name}, 'Deleted User')
        `.as("memberName"),
      })
      .from(schema.contribution)
      .leftJoin(
        schema.User,
        eq(schema.User.id, schema.contribution.userId)
      )
      .orderBy(desc(schema.contribution.createdAt));

    res.json({
      success: true,
      data: contributions,
    });
  } catch (err) {
    console.error("Get All Contributions Error:", err);
    res.status(500).json({
      message: "Server error fetching contributions",
    });
  }
};


/* -------------------------------------------------
   ADMIN DASHBOARD STATS
------------------------------------------------- */
export const getAdminStats = async (req, res) => {
  try {
    const [
      users,
      loans,
      investments,
      contributions,
      pendingInvestments,
      pendingLoans,
    ] = await Promise.all([
      db.select({ count: sql`count(*)` }).from(schema.User),
      db.select({ count: sql`count(*)` }).from(schema.loan),
      db.select({ count: sql`count(*)` }).from(schema.investment),
      db.select({ count: sql`count(*)` }).from(schema.contribution),
      db.select({ count: sql`count(*)` }).from(schema.investment).where(eq(schema.investment.status, "pending")),
      db.select({ count: sql`count(*)` }).from(schema.loan).where(eq(schema.loan.status, "pending")),
    ]);

    const totalContributions = await db
    .select({ count: sql`count(*)` })
    .from(schema.contribution);

    const pendingContributions = await db
    .select({ count: sql`count(*)` })
    .from(schema.contribution)
    .where(eq(schema.contribution.status, "pending"));

    res.json({
      success: true,
      data: {
        totalUsers: Number(users[0].count),
        totalLoans: Number(loans[0].count),
        totalInvestments: Number(investments[0].count),
        totalContributions: Number(totalContributions[0].count),
        pendingContributions: Number(pendingContributions[0].count),
        pendingInvestments: Number(pendingInvestments[0].count),
        pendingLoans: Number(pendingLoans[0].count),
      },
    });
  } catch (err) {
    console.error("Get Admin Stats Error:", err);
    res.status(500).json({ message: "Server error fetching stats" });
  }
};

/* -------------------------------------------------
   APPROVE INVESTMENT
------------------------------------------------- */
export const approveInvestment = async (req, res) => {
  const { id } = req.params;
  const investmentId = Number(id);

  if (isNaN(investmentId) || investmentId <= 0) {
    return res.status(400).json({ message: "Invalid investment ID" });
  }

  try {
    const [updated] = await db
      .update(schema.investment)
      .set({ status: "successful" })
      .where(eq(schema.investment.id, investmentId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Investment not found" });
    }

    await db.insert(schema.notification).values({
      userid: updated.userId,
      title: "Investment Approved",
      message: `Your investment of ₦${Number(updated.amount).toLocaleString()} has been approved successfully.`,
      isread: false,
    });

    res.json({
      success: true,
      message: "Investment approved successfully",
      investment: updated,
    });
  } catch (error) {
    console.error("Approve investment error:", error);
    res.status(500).json({ message: "Failed to approve investment" });
  }
};



/* -------------------------------------------------
   APPROVE LOAN
------------------------------------------------- */
export const approveLoan = async (req, res) => {
  const { id } = req.params;
  const loanId = parseInt(id, 10);

  if (isNaN(loanId) || loanId <= 0) {
    return res.status(400).json({ error: "Invalid or missing loan ID" });
  }

  try {
    const [updated] = await db
      .update(schema.loan)
      .set({ status: "approved" })
      .where(eq(schema.loan.id, loanId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Loan not found" });
    }

    await db.insert(schema.notification).values({
      userid: updated.userId,
      title: "Loan Approved!",
      message: `Your ₦${Number(updated.amount).toLocaleString()} loan has been approved!`,
      isread: false,
    });

    res.json({
      success: true,
      message: "Loan approved & user notified!",
      loan: updated,
    });
  } catch (error) {
    console.error("Approve loan error:", error);
    res.status(500).json({ error: "Failed to approve loan" });
  }
};

/* -------------------------------------------------
   REJECT LOAN
------------------------------------------------- */
export const rejectLoan = async (req, res) => {
  const { id } = req.params;
  const loanId = parseInt(id, 10);

  if (isNaN(loanId) || loanId <= 0) {
    return res.status(400).json({ error: "Invalid or missing loan ID" });
  }

  try {
    const [updated] = await db
      .update(schema.loan)
      .set({ status: "rejected" })
      .where(eq(schema.loan.id, loanId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Loan not found" });
    }

    await db.insert(schema.notification).values({
      userid: updated.userId,
      title: "Loan Rejected",
      message: `We're sorry, your ₦${Number(updated.amount).toLocaleString()} loan application was rejected.`,
      isread: false,
    });

    res.json({
      success: true,
      message: "Loan rejected & user notified!",
      loan: updated,
    });
  } catch (error) {
    console.error("Reject loan error:", error);
    res.status(500).json({ error: "Failed to reject loan" });
  }
};

export const createContribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const [created] = await db
      .insert(schema.contribution)
      .values({
        userId,
        amount,
        status: "pending",
      })
      .returning();

    res.json({ success: true, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


export const approveContribution = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(schema.contribution)
      .set({ status: "successful" })
      .where(eq(schema.contribution.id, Number(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Contribution not found" });
    }

    await db.insert(schema.notification).values({
      userid: updated.userId,
      title: "Contribution Approved",
      message: `Your contribution of ₦${Number(updated.amount).toLocaleString()} has been approved.`,
      isread: false,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Approve Contribution Error:", err);
    res.status(500).json({ message: "Failed to approve contribution" });
  }
};



/* -------------------------------------------------
   USER STATUS HELPERS
------------------------------------------------- */
const updateUserStatus = async (id, status) => {
  const [result] = await db
    .update(schema.User)
    .set({ status })
    .where(eq(schema.User.id, id))
    .returning();
  return result || null;
};

export const suspendUser = async (req, res) => {
  const updated = await updateUserStatus(Number(req.params.id), "suspended");
  if (!updated) return res.status(404).json({ message: "User not found" });
  res.json({ message: `User ${updated.name} has been suspended` });
};

export const deactivateUser = async (req, res) => {
  const updated = await updateUserStatus(Number(req.params.id), "deactivated");
  if (!updated) return res.status(404).json({ message: "User not found" });
  res.json({ message: `User ${updated.name} has been deactivated` });
};

export const activateUser = async (req, res) => {
  const updated = await updateUserStatus(Number(req.params.id), "active");
  if (!updated) return res.status(404).json({ message: "User not found" });
  res.json({ message: `User ${updated.name} has been activated` });
};

/* -------------------------------------------------
   UPDATE USER ROLE
------------------------------------------------- */
export const updateUserRole = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;

    const [updated] = await db
      .update(schema.User)
      .set({ role })
      .where(eq(schema.User.id, id))
      .returning();

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error("Update User Role Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -------------------------------------------------
   SEND NOTIFICATION (EMAIL)
------------------------------------------------- */
export const sendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    const [user] = await db.select().from(schema.User).where(eq(schema.User.id, Number(id)));
    if (!user) return res.status(404).json({ message: "User not found" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      html: `<p>Hello ${user.name},</p><p>${message}</p><p>Thank you!<br/>Hope Team</p>`,
    });

    res.json({ message: `Notification sent to ${user.name}` });
  } catch (err) {
    console.error("Send Notification Error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
};

/* -------------------------------------------------
   GET USER BY ID (with loans, investments, contributions)
------------------------------------------------- */
export const getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [userData] = await db.select().from(schema.User).where(eq(schema.User.id, id));
    if (!userData) return res.status(404).json({ message: "User not found" });

    const [loans, investments, contributions] = await Promise.all([
      db.select().from(schema.loan).where(eq(schema.loan.userId, id)),
      db.select().from(schema.investment).where(eq(schema.investment.userId, id)),
      db.select().from(schema.contribution).where(eq(schema.contribution.userId, id)),
    ]);

    res.json({ ...userData, loans, investments, contributions });
  } catch (err) {
    console.error("Get User By ID Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -------------------------------------------------
   DELETE USER
------------------------------------------------- */
export const deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [deleted] = await db.delete(schema.User).where(eq(schema.User.id, id)).returning();
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.json({ message: `User ${deleted.name} deleted successfully` });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Server error" });
  }

  console.log("ADMIN CONTROLLER EXPORTS LOADED");
};
