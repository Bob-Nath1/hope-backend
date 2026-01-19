import { db } from "../db.js";
import * as schema from "../drizzle/schema.js";
import { eq, desc } from "drizzle-orm";

/* ===============================
   GET COMMUNITY MESSAGES
================================ */
export const getCommunityMessages = async (req, res) => {
  try {
    const planCode = req.params.plan;

    const [plan] = await db
      .select()
      .from(schema.Plan)
      .where(eq(schema.Plan.code, planCode));

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const messages = await db
      .select({
        id: schema.CommunityMessage.id,
        message: schema.CommunityMessage.content,
        createdAt: schema.CommunityMessage.createdAt,
        userId: schema.CommunityMessage.userId, // ✅ KEY
      })
      .from(schema.CommunityMessage)
      .where(eq(schema.CommunityMessage.planId, plan.id))
      .orderBy(schema.CommunityMessage.createdAt);

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Community fetch error:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

/* ===============================
   SEND COMMUNITY MESSAGE
================================ */
export const sendCommunityMessage = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { plan } = req.params;
    const { message } = req.body;

    console.log("📨 Incoming community message:", {
      userId,
      planCode: plan,
      message,
    });

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message required" });
    }

    const [planRow] = await db
      .select()
      .from(schema.Plan)
      .where(eq(schema.Plan.code, plan));

    if (!planRow) {
      return res.status(404).json({ message: "Invalid plan" });
    }

    const [saved] = await db
      .insert(schema.CommunityMessage)
      .values({
        userId,
        planId: planRow.id,
        content: message.trim(), // ✅ IMPORTANT
      })
      .returning();

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Community send error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

