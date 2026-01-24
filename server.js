// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminWithdrawalRoutes from "./routes/adminWithdrawalRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminReportRoutes from "./routes/adminReportRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import contributionRoutes from "./routes/contributionRoutes.js";

const app = express();

/* -------------------- MIDDLEWARE -------------------- */

// CORS (Netlify + local dev)
app.use(
  cors({
    origin: [
      "https://conthop.netlify.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// JSON parser
app.use(express.json());

// Static files
app.use("/uploads", express.static("uploads"));

/* -------------------- ROUTES -------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/admin/support-center", adminReportRoutes);

app.use("/api/user", userRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/contributions", contributionRoutes);

/* -------------------- FALLBACKS -------------------- */

// Health check (IMPORTANT for testing)
app.get("/", (req, res) => {
  res.json({ status: "Backend is running 🚀" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

/* -------------------- START SERVER -------------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

