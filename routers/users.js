const express = require("express");
const router = express.Router();
const {
  getUsersWithGenerations,
  editUser,
  deleteUser,
  getUserById,
} = require("../controllers/userController");
const { authMiddleware, adminOnly } = require("../middleware/adminMiddleware");

// Endpoint to get all users with their generated objects populated
router.get("/", getUsersWithGenerations);
router.get("/:userId", getUserById);
router.put("/edit/:userId", authMiddleware, adminOnly, editUser);
router.delete("/delete/:userId", authMiddleware, adminOnly, deleteUser);

module.exports = router;
