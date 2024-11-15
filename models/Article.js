const mongoose = require("mongoose");
const { Config } = require("../config/config");

const articleSchema = new mongoose.Schema(
  {
    image: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to add base URL to image URLs
articleSchema.virtual("imageUrl").get(function () {
  const baseUrl = process.env.BASE_URL || `${Config.baseUrl}${Config.port}`;
  return `${baseUrl}${this.image}`;
});

const Articles = mongoose.model("Article", articleSchema);
module.exports = Articles;
