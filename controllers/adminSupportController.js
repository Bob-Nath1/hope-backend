// backend/controllers/reportController.js
import { db } from "../db.js";
import { eq, desc } from "drizzle-orm";

// Import tables directly
import { report, support, user } from "../drizzle/schema.js";

/* -------------------------------------------------
   GET ALL REPORTS
------------------------------------------------- */
export const getAllReports = async (req, res) => {
  try {
    const reportsData = await db
      .select({
        reportId: report.id,
        title: report.title,
        description: report.content,
        reply: report.reply,
        createdAt: report.date,
        userName: user.name,
        userEmail: user.email,
      })
      .from(report)
      .leftJoin(user, eq(user.id, report.userId))
      .orderBy(desc(report.date)); // order newest first

    res.json({ success: true, data: reportsData });
  } catch (err) {
    console.error("Get Reports Error:", err);
    res.status(500).json({ message: "Server error fetching reports" });
  }
};

/* -------------------------------------------------
   REPLY TO A REPORT
------------------------------------------------- */
export const replyReport = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const { reply } = req.body;

    if (isNaN(reportId)) return res.status(400).json({ message: "Invalid report ID" });

    const updated = await db
      .update(report)
      .set({ reply })
      .where(eq(report.id, reportId))
      .returning();

    if (!updated.length) return res.status(404).json({ message: "Report not found" });

    res.json({ success: true, message: "Reply sent", data: updated[0] });
  } catch (err) {
    console.error("Reply Report Error:", err);
    res.status(500).json({ message: "Server error replying to report" });
  }
};

/* -------------------------------------------------
   GET ALL SUPPORT REQUESTS
------------------------------------------------- */
export const getAllSupport = async (req, res) => {
  try {
    const supportData = await db
      .select({
        supportId: support.id,
        message: support.message,
        reply: support.reply,
        createdAt: support.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(support)
      .leftJoin(user, eq(user.id, support.userId))
      .orderBy(desc(support.createdAt)); // order newest first

    res.json({ success: true, data: supportData });
  } catch (err) {
    console.error("Get Support Error:", err);
    res.status(500).json({ message: "Server error fetching support requests" });
  }
};

/* -------------------------------------------------
   REPLY TO SUPPORT REQUEST
------------------------------------------------- */
export const replySupport = async (req, res) => {
  try {
    const supportId = Number(req.params.id);
    const { reply } = req.body;

    if (isNaN(supportId)) return res.status(400).json({ message: "Invalid support request ID" });

    const updated = await db
      .update(support)
      .set({ reply })
      .where(eq(support.id, supportId))
      .returning();

    if (!updated.length) return res.status(404).json({ message: "Support request not found" });

    res.json({ success: true, message: "Reply sent", data: updated[0] });
  } catch (err) {
    console.error("Reply Support Error:", err);
    res.status(500).json({ message: "Server error replying to support request" });
  }
};
