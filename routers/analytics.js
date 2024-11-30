const express = require("express");
const {
  getAllAnalytics,
  getAnalyticsById,
  editAnalytics,
  deleteAnalytics,
} = require("../controllers/analyticsController");
const { authMiddleware, adminOnly } = require("../middleware/adminMiddleware");
const router = express.Router();

// Get all analytics
router.get("/", authMiddleware, adminOnly, getAllAnalytics);

// Get analytics by ID
router.get("/:id", getAnalyticsById);

// Edit analytics by ID (admin only)
router.put("/:analyticsId", authMiddleware, adminOnly, editAnalytics);

// Delete analytics by ID (admin only)
router.delete("/:analyticsId", authMiddleware, adminOnly, deleteAnalytics);

module.exports = router;
