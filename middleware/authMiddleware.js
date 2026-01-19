// backend/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import { db } from "../db.js";
import * as schema from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

/* =========================
   VERIFY TOKEN (BASE)
========================= */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth Header:", authHeader); // ← ADD THIS

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No token provided"); // ← ADD THIS
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token:", token ? "present" : "missing"); // ← ADD THIS

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded user:", decoded); // ← ADD THIS

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message); // ← ADD THIS
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


/* =========================
   VERIFY ADMIN
========================= */
export const verifyAdmin = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const [foundUser] = await db
      .select()
      .from(schema.User)
      .where(eq(schema.User.id, req.user.id));

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (foundUser.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    // Attach full DB user (optional but useful)
    req.user.dbUser = foundUser;

    next();
  } catch (error) {
    console.error("❌ verifyAdmin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};





/* =========================
   VERIFY NORMAL USER
========================= */
export const verifyUser = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const [foundUser] = await db
      .select()
      .from(schema.User)
      .where(eq(schema.User.id, req.user.id));

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (foundUser.status !== "active") {
      return res.status(403).json({
        message: "User account not active",
      });
    }

    req.user.dbUser = foundUser;
    next();
  } catch (error) {
    console.error("❌ verifyUser error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


