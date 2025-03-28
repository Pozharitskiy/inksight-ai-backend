const mongoose = require("mongoose");
const { Config } = require("../config/config");

const generatedSchema = new mongoose.Schema(
  {
    images: [{ type: String }],
    prompt: { type: String, required: true },
    userId: { type: String },
    // userId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   default: null,
    // },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "pending",
    },
    retryCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to add base URL to image URLs
generatedSchema.virtual("imageUrls").get(function () {
  const baseUrl = process.env.BASE_URL || `${Config.baseUrl}${Config.port}`;
  return this.images.map((image) => `${baseUrl}${image}`);
});

const Generations = mongoose.model("Generated", generatedSchema);
module.exports = Generations;
