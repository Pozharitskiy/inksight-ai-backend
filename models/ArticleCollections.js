// models/ArticleCollections.js
const mongoose = require("mongoose");

const articleCollectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }], // Array of article references
  },
  {
    timestamps: true,
  }
);

const ArticleCollections = mongoose.model(
  "ArticleCollection",
  articleCollectionSchema
);
module.exports = ArticleCollections;
