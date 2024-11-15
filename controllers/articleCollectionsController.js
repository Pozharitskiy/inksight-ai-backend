// controllers/articleCollectionsController.js
const ArticleCollections = require("../models/ArticleCollections");
const { default: mongoose } = require("mongoose");

module.exports = {
  // Get all collections
  getAllCollections: async (req, res) => {
    try {
      const collections = await ArticleCollections.find().populate("articles");
      res.json({ results: collections, count: collections.length });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching collections" });
    }
  },

  // Get a single collection by ID
  getCollectionById: async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const collection = await ArticleCollections.findById(id).populate(
        "articles"
      );

      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }

      res.json(collection);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching the collection" });
    }
  },

  // Create a new collection
  createCollection: async (req, res) => {
    const { name, articles } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Collection name is required" });
    }

    try {
      const newCollection = new ArticleCollections({ name, articles });
      await newCollection.save();
      res.status(201).json({
        message: "Collection created successfully",
        collection: newCollection,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while creating the collection" });
    }
  },

  // Update a collection by ID
  updateCollection: async (req, res) => {
    const { id } = req.params;
    const { name, articles } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const collection = await ArticleCollections.findById(id);

      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }

      if (name) collection.name = name;
      if (articles && Array.isArray(articles)) collection.articles = articles;

      await collection.save();
      res.json({ message: "Collection updated successfully", collection });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while updating the collection" });
    }
  },

  // Delete a collection by ID
  deleteCollection: async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const collection = await ArticleCollections.findById(id);

      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }

      await collection.deleteOne();
      res.json({ message: "Collection deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while deleting the collection" });
    }
  },
};
