// backend/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { db } from "../db.js";
import * as schema from "../drizzle/schema.js";
import { eq, gt, and, sql, inArray } from "drizzle-orm";

// --------------------------
// Multer setup
// --------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${file.fieldname}_${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });

// --------------------------
// Register User
// --------------------------
export const registerUser = async (req, res) => {
  console.log("Incoming req.body:", req.body);
  console.log("Incoming files:", req.files);

  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      dateOfBirth,
      occupation,
      bankName,
      accountName,
      accountNumber,
      securityQuestion,
      securityAnswer,
    } = req.body;

    const plans = req.body.plans ? JSON.parse(req.body.plans).map(p => p) : [];
    console.log("Parsed plans array:", plans);

    

    if (!plans.length)
      return res
        .status(400)
        .json({ message: "Please select at least one plan." });


    if (!dateOfBirth) {
      return res
        .status(400)
        .json({ message: "Date of birth is required." });
    }

    const age =
      new Date().getFullYear() - new Date(dateOfBirth).getFullYear();

    if (age < 18) {
      return res
        .status(400)
        .json({ message: "You must be at least 18 years old." });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(schema.User)
      .where(eq(schema.User.email, email));

    if (existingUser.length) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    const idDocument = req.files?.idDocument
      ? `${baseUrl}/uploads/${req.files.idDocument[0].filename}`
      : null;

    const profilePicture = req.files?.profilePicture
      ? `${baseUrl}/uploads/${req.files.profilePicture[0].filename}`
      : null;

 // --------------------------
// Create User + Link Plans (TRANSACTION)
// --------------------------
const planRows = await db
  .select()
  .from(schema.Plan)
  .where(inArray(schema.Plan.code, plans));

if (!planRows.length) {
  return res.status(400).json({ message: "Invalid plan selection." });
}

let user;

await db.transaction(async (tx) => {
  // 1️⃣ Insert user
  const insertedUsers = await tx
    .insert(schema.User)
    .values({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      address: address || null,
      dateOfBirth: new Date(dateOfBirth),
      occupation: occupation || null,
      bankName: bankName || null,
      accountName: accountName || null,
      accountNumber: accountNumber || null,
      securityQuestion: securityQuestion || null,
      securityAnswer: securityAnswer || null,
      idDocument,
      profilePicture,
      role: "user",
      status: "active",
    })
    .returning();

  user = insertedUsers[0];

  // 2️⃣ Insert user plans
  await tx.insert(schema.UserPlan).values(
    planRows.map((p) => ({
      userId: user.id,
      planId: p.id,
    }))
  );
});

console.log("👤 User + plans saved atomically:", user.id);



   
    // --------------------------
    // Generate JWT
    // --------------------------
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "User created successfully",
      user,
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------
// Login User
// --------------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const users = await db
      .select()
      .from(schema.User)
      .where(eq(schema.User.email, email));

    if (!users.length) {
      return res.status(404).json({ message: "Account not found." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// --------------------------
// Forgot Password
// --------------------------
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const users = await db
      .select()
      .from(schema.User)
      .where(eq(schema.User.email, email));

    if (!users.length) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(schema.User)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpire,
      })
      .where(eq(schema.User.id, user.id));

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request",
      html: `
        <p>Hello ${user.name || "User"},</p>
        <p>You requested a password reset.</p>
        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ message: "Reset link sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// --------------------------
// Reset Password
// --------------------------
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const users = await db
      .select()
      .from(schema.User)
      .where(
        and(
          eq(schema.User.resetPasswordToken, token),
          gt(schema.User.resetPasswordExpire, new Date())
        )
      );

    if (!users.length) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const user = users[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await db
      .update(schema.User)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      })
      .where(eq(schema.User.id, user.id));

    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// --------------------------
// Get Dashboard Stats
// --------------------------
export const getDashboardStats = async (req, res) => {
  try {
    const [{ count: totalUsers }] = await db
      .select({ count: sql`count(*)` })
      .from(schema.User);

    const [{ count: totalLoans }] = await db
      .select({ count: sql`count(*)` })
      .from(schema.loan);

    const [{ count: totalInvestments }] = await db
      .select({ count: sql`count(*)` })
      .from(schema.investment);

    const [{ count: totalContributions }] = await db
      .select({ count: sql`count(*)` })
      .from(schema.contribution);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalLoans,
        totalInvestments,
        totalContributions,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Error fetching dashboard stats." });
  }
};

