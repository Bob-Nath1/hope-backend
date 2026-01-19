import { db } from "../db.js";
import { support, User, notification } from "../drizzle/schema.js";
import { eq, desc } from "drizzle-orm";


/* ===============================
   GET all support messages (Admin)
================================ */
export const getSupports = async (req, res) => {
  try {
    const supportsList = await db
      .select({
        id: support.id,
        message: support.message,
        reply: support.reply,
        status: support.status,
        createdAt: support.createdAt,
        user: {
          name: User.name,
        },
      })
      .from(support)
      .leftJoin(User, eq(support.userId, User.id))
      .orderBy(desc(support.createdAt));

    res.json({ success: true, data: supportsList });
  } catch (err) {
    console.error("Error fetching support messages:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch support messages",
    });
  }
};

/* ===============================
   Admin replies to support
================================ */
export const replySupport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply cannot be empty",
      });
    }

    const [updated] = await db
      .update(support)
      .set({
        reply: reply.trim(),
        status: "replied",
      })
      .where(eq(support.id, Number(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Support message not found",
      });
    }

    // 🔔 CREATE NOTIFICATION FOR USER (THIS WAS MISSING)
    await db.insert(notification).values({
      userid: updated.userId,
      title: "Support Reply from Admin",
      message: reply.trim(),
      isread: false,
    });

    res.json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (err) {
    console.error("Error replying to support message:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



/* ===============================
   User submits support message
================================ */
export const createSupportMessage = async (req, res) => { 
  try { 
    const userId = Number(req.user?.id);
    const { message } = req.body; 
    if (!userId || isNaN(userId)) { return res.status(401).json({ success: false, message: "Invalid user" }); 
  } 
  if (!message || typeof message !== "string" || message.trim() === "") { return res.status(400).json({ success: false, message: "Message is required" }); 
  } 
    const [ticket] = await db .insert(support) .values({ userId, message: message.trim(), status: "pending", }) .returning(); 
    if (!ticket) { return res.status(500).json({ success: false, message: "Failed to create ticket" }); 
  } res.status(201).json({ success: true, data: ticket }); } catch (err) { console.error("Support creation error:", err);  
 res.status(500).json({ success: false, message: "Server error. Check logs." }); 
} 
};


