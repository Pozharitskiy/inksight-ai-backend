const express = require("express");
const {
  deleteItem,
  getAllNames,
  getItem,
  updateItem,
  importBulk,
  getAll,
  getItemById,
  create,
} = require("../controllers/dictionaryController");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authMiddleware, adminOnly } = require("../middleware/adminMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder to store uploaded files
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-dictionary${ext}`;
    cb(null, fileName);
  },
});
const upload = multer({ storage });

// Get all analytics
router.get("/", getAllNames);

// Get analytics by ID
router.get("/name/:name", getItem);

router.get("/id/:id", getItemById);

router.get("/all/", getAll);

// Edit analytics by ID (admin only)
router.put("/:id", authMiddleware, adminOnly, updateItem);

router.post("/", authMiddleware, adminOnly, create);

// Delete analytics by ID (admin only)
router.delete("/:id", authMiddleware, adminOnly, deleteItem);

router.post(
  "/import-csv",
  authMiddleware,
  adminOnly,
  upload.single("file"),
  importBulk
);

module.exports = router;
