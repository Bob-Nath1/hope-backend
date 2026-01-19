// server.js ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←

import "dotenv/config";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminWithdrawalRoutes from "./routes/adminWithdrawalRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // ← already imported
import adminReportRoutes from "./routes/adminReportRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import contributionRoutes from "./routes/contributionRoutes.js";




const app = express();

// CORS first
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// JSON parser second (MUST be before any route that reads body!)
app.use(express.json());

// STATIC FILES
app.use("/uploads", express.static("uploads"));

// ALL ROUTES BELOW — order doesn't matter as long as they come after express.json()
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/user", userRoutes); // ← NOW IN THE RIGHT PLACE
app.use("/api/admin/support-center", adminReportRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/contributions", contributionRoutes);

// 404 & Error handlers
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
