const { default: mongoose } = require("mongoose");
const Articles = require("../models/Article");

module.exports = {
  // Get all articles
  getAllArticles: async (req, res) => {
    try {
      const articles = await Articles.find();
      res.json({ results: articles, count: articles.length });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching articles" });
    }
  },

  // Get an article by ID
  getArticleById: async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const article = await Articles.findById(id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching the article" });
    }
  },

  // Create a new article
  createArticle: async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    try {
      // Construct the image URL if an image was uploaded
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const newArticle = new Articles({ image: imageUrl, title, content });
      await newArticle.save();

      res
        .status(201)
        .json({ message: "Article created successfully", article: newArticle });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while creating the article" });
    }
  },

  // Like an article
  likeArticle: async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const article = await Articles.findById(id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      article.likes += 1;
      await article.save();

      res.json({ message: "Article liked successfully", article });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while liking the article" });
    }
  },

  // Dislike an article
  dislikeArticle: async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const article = await Articles.findById(id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      article.dislikes += 1;
      await article.save();

      res.json({ message: "Article disliked successfully", article });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while disliking the article" });
    }
  },

  // Update an article
  updateArticle: async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const article = await Articles.findById(id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Update fields if they are provided in the form-data
      if (title) article.title = title;
      if (content) article.content = content;

      // If an image file is uploaded, update the image path
      if (req.file) {
        article.image = `/uploads/${req.file.filename}`;
      }

      await article.save();
      res.json({ message: "Article updated successfully", article });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while updating the article" });
    }
  },

  // Delete an article
  deleteArticle: async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const article = await Articles.findById(id);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      await article.deleteOne();
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while deleting the article" });
    }
  },
};
