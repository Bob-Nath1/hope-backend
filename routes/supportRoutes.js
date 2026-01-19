import express from "express";
import {
  getSupports,
  replySupport,
  createSupportMessage,
} from "../controllers/supportController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
  // for users
import { verifyAdmin } from "../middleware/authMiddleware.js";
   // for admin

const router = express.Router();



// User: Submit a support message
router.post(
  "/",
  (req, res, next) => {
    console.log("🚨 SUPPORT ROUTE HIT");
    next();
  },
  verifyToken,
  createSupportMessage
);

router.get("/", verifyToken, verifyAdmin, getSupports);
router.post("/reply/:id", verifyToken, verifyAdmin, replySupport);


export default router;
