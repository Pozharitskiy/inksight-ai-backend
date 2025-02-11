const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    prompt: { type: String, required: true },
    wishes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "pending",
    },
    images: [{ type: String }],
    retryCount: { type: Number, default: 0 },
    generationId: { type: mongoose.Schema.Types.ObjectId, ref: "Generated", default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
