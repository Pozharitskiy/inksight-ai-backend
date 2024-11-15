const express = require("express");
const {
  getAllArticles,
  getArticleById,
  likeArticle,
  dislikeArticle,
  updateArticle,
  deleteArticle,
  createArticle,
} = require("../controllers/articlesController");
const { authMiddleware, adminOnly } = require("../middleware/adminMiddleware");
const upload = require("../middleware/upload");
const router = express.Router();

// Get all articles
router.get("/", getAllArticles);

// Get article by ID
router.get("/:id", getArticleById);

// Create a new article (admin only)
router.post(
  "/",
  authMiddleware,
  adminOnly,
  upload.single("image"),
  createArticle
);

// Like an article
router.post("/:id/like", likeArticle);

// Dislike an article
router.post("/:id/dislike", dislikeArticle);

// Update article by ID (admin only)
router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  upload.single("image"),
  updateArticle
);

// Delete article by ID (admin only)
router.delete("/:id", authMiddleware, adminOnly, deleteArticle);

module.exports = router;
