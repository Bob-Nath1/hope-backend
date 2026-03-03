import express from "express";
import { db } from "../db.js";
import { userSettings } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

/* GET SETTINGS */
router.get("/", async (req, res) => {
  try {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, req.user.id));

    if (!settings) {
      return res.json({
        notificationsEnabled: true,
        darkMode: false,
        language: "English",
      });
    }

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* UPDATE SETTINGS */
router.put("/", async (req, res) => {
  try {
    const { notificationsEnabled, darkMode, language } = req.body;

    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, req.user.id));

    if (!existing) {
      const [created] = await db
        .insert(userSettings)
        .values({
          userId: req.user.id,
          notificationsEnabled,
          darkMode,
          language,
        })
        .returning();

      return res.json(created);
    }

    const [updated] = await db
      .update(userSettings)
      .set({
        notificationsEnabled,
        darkMode,
        language,
      })
      .where(eq(userSettings.userId, req.user.id))
      .returning();

    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;