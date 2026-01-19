import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { user } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("📩 Signup request received:", req.body);

    // Check if user exists
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, email)); // ✅ Corrected

    if (existing.length) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(user)
      .values({ name, email, password: hashed })
      .returning();

    // Generate JWT token
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ ...newUser, token });
  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};
