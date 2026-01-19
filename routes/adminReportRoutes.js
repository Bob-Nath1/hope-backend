// backend/routes/adminReportRoutes.js
import express from "express";
import { db } from "../db.js";
import * as schema from "../drizzle/schema.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { eq, desc } from "drizzle-orm";

const router = express.Router();

router.use(verifyToken);
router.use(verifyAdmin);

// GET ALL REPORTS — 100% SAFE, NO CRASH
router.get("/reports", async (req, res) => {
  try {
    // Get all reports (no join)
    const reports = await db
      .select({
        id: schema.report.id,
        title: schema.report.title,
        content: schema.report.content,
        reply: schema.report.reply,
        status: schema.report.status,
        createdat: schema.report.createdat,
        userId: schema.report.userId,
      })
      .from(schema.report)
      .orderBy(desc(schema.report.createdat));

    // Add user info safely — with try/catch for deleted users
    const reportsWithUser = await Promise.all(
      reports.map(async (report) => {
        let userName = "Deleted User";
        let userEmail = "no-email@deleted.com";

        if (report.userId) {
          try {
            const [user] = await db
              .select({ name: schema.user.name, email: schema.user.email })
              .from(schema.user)
              .where(eq(schema.user.id, report.userId))
              .limit(1);

            if (user && user.name) {
              userName = user.name;
              userEmail = user.email || "no-email";
            }
          } catch (err) {
            // If user deleted, query fails — catch it
            console.log(`User ${report.userId} not found for report ${report.id}`);
          }
        }

        return {
          id: report.id,
          title: report.title,
          content: report.content,
          reply: report.reply,
          status: report.status,
          createdat: report.createdat,
          userId: report.userId,
          userName,
          userEmail,
        };
      })
    );

    res.json({ success: true, data: reportsWithUser });
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ message: "Server error" });
  }
});




// ADMIN REPLY — FIXED TEMPLATE STRING
router.post("/reports/reply/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply?.trim()) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    const [updatedReport] = await db
      .update(schema.report)
      .set({ reply: reply.trim(), status: "reviewed" })
      .where(eq(schema.report.id, Number(id)))
      .returning();

    if (!updatedReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    await db.insert(schema.notification).values({
      userid: updatedReport.userId,
      title: "Report Reply from Admin",
      message: `Regarding your "${updatedReport.title}" report: ${reply.trim()}`,
      isread: false,
    });

    res.json({ success: true, message: "Reply sent!" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;