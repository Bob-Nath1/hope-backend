import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import * as schema from "../drizzle/schema.js";

export const verifyPlanAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { plan } = req.params; // expected: daily, weekly, monthly

    // Admin bypass
    if (req.user.role === "admin") {
      return next();
    }

    const hasAccess = await db
      .select()
      .from(schema.UserPlan)
      .leftJoin(
        schema.Plan,
        eq(schema.Plan.id, schema.UserPlan.planId)
      )
      .where(
        and(
          eq(schema.UserPlan.userId, userId),
          eq(schema.Plan.code, plan)
        )
      );

    if (!hasAccess.length) {
      return res.status(403).json({
        message: "You do not belong to this plan",
      });
    }

    next();
  } catch (error) {
    console.error("verifyPlanAccess error:", error);
    res.status(500).json({ message: "Plan verification failed" });
  }
};

