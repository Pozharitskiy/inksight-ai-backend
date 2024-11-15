const express = require("express");
const {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} = require("../controllers/articleCollectionsController");
const { authMiddleware, adminOnly } = require("../middleware/adminMiddleware");
const router = express.Router();

// Get all collections
router.get("/", getAllCollections);

// Get collection by ID
router.get("/:id", getCollectionById);

// Create a new collection (admin only)
router.post("/", authMiddleware, adminOnly, createCollection);

// Update a collection by ID (admin only)
router.put("/:id", authMiddleware, adminOnly, updateCollection);

// Delete a collection by ID (admin only)
router.delete("/:id", authMiddleware, adminOnly, deleteCollection);

module.exports = router;
