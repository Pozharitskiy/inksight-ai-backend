const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // Link to the image in file storage
    result: { type: String, required: true }, // The result string from myAssistant
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Reference to the user
    prompt: { type: String, required: true },
    version: { type: String, required: true },
    threadId: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }, // Automatically add created date
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to add base URL to image URL
analyticsSchema.virtual("imageUrl").get(function () {
  const baseUrl = process.env.BASE_URL || `${Config.baseUrl}${Config.port}`;
  return `${baseUrl}${this.image}`;
});

const Analytics = mongoose.model("Analytics", analyticsSchema);
module.exports = Analytics;
