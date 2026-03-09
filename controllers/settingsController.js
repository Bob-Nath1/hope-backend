// controllers/settingsController.js
import { db } from "../db.js";
import { userSettings, User } from "../drizzle/schema.js"; // adjust if users table name is different
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const otpStore = new Map(); // ← consider moving to Redis / DB later

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    User: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const getSettings = async (req, res) => {
  try {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.UserId, req.User.id));

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
};

export const updateSettings = async (req, res) => {
  try {
    const { notificationsEnabled, darkMode, language } = req.body;

  if (
  typeof notificationsEnabled !== 'boolean' ||
  typeof darkMode !== 'boolean' ||
  !['English', 'French', 'Spanish', 'Swahili'].includes(language)
) {
  return res.status(400).json({ message: "Invalid settings values" });
}

    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.UserId, req.User.id));

    if (!existing) {
      const [created] = await db
        .insert(userSettings)
        .values({
          UserId: req.User.id,
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
      .where(eq(userSettings.UserId, req.User.id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const requestPasswordChange = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const [User] = await db.select().from(Users).where(eq(Users.id, req.User.id));
    if (!User) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, User.password);
    if (!isMatch) return res.status(401).json({ message: "Current password incorrect" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    otpStore.set(req.User.id, {
      otp,
      expires,
      newPasswordHash: await bcrypt.hash(newPassword, 10),
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: User.email,
      subject: "Your Password Change Verification Code",
      text: `Your verification code is ${otp}. It expires in 10 minute.`,
      html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });

    res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyPasswordChange = async (req, res) => {
  const { otp } = req.body;

  const data = otpStore.get(req.User.id);
  if (!data) return res.status(400).json({ message: "No pending request" });

  if (Date.now() > data.expires) {
    otpStore.delete(req.User.id);
    return res.status(400).json({ message: "Code expired" });
  }

  if (otp !== data.otp) {
    return res.status(400).json({ message: "Invalid code" });
  }

  await db
    .update(Users)
    .set({ password: data.newPasswordHash })
    .where(eq(Users.id, req.User.id));

  otpStore.delete(req.User.id);

  res.json({ message: "Password changed successfully" });
};
