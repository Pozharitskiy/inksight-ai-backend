const express = require("express");
const router = express.Router();
const { authMiddleware, adminOnly } = require("../middleware/adminMiddleware");
const {
  editGeneration,
  deleteGeneration,
  getAllGenerations,
  getById,
} = require("../controllers/generatesController");

// endpoint to get all generations
router.get("/", getAllGenerations);

// endpoint to get generations for a specific user by userId
router.get("/:id", getById);

// Edit a specific generation by ID (admin only)
router.put("/:generationId", authMiddleware, adminOnly, editGeneration);

// Delete a specific generation by ID (admin only)
router.delete("/:generationId", authMiddleware, adminOnly, deleteGeneration);

module.exports = router;
