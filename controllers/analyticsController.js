const mongoose = require("mongoose");
const Analytics = require("../models/Analytics");

module.exports = {
  // Get all analytics objects
  getAllAnalytics: async (req, res) => {
    try {
      const items = await Analytics.find().populate("userId", "deviceId");
      res.json({ results: items, count: items?.length });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching analytics objects" });
    }
  },

  // Get analytics by ID
  getAnalyticsById: async (req, res) => {
    const { id } = req.params;

    // Validate if the provided id is a valid ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      // Find the analytics by its ID and populate userId with deviceId
      const item = await Analytics.findById(id).populate("userId", "deviceId");

      // If the analytics is not found, return a 404 error
      if (!item) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      // Return the found analytics object
      res.json(item);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching the analytics" });
    }
  },

  // Edit a specific analytics by ID (admin only)
  editAnalytics: async (req, res) => {
    const { analyticsId } = req.params;
    const { prompt, result, version, threadId, image } = req.body;

    try {
      const analytics = await Analytics.findById(analyticsId);

      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      // Update analytics fields
      if (prompt) analytics.prompt = prompt;
      if (result) analytics.result = result;
      if (version) analytics.version = version;
      if (threadId) analytics.threadId = threadId;
      if (image) analytics.image = image;

      await analytics.save();
      res.json({ message: "Analytics updated successfully", analytics });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while updating analytics" });
    }
  },

  // Delete a specific analytics by ID (admin only)
  deleteAnalytics: async (req, res) => {
    const { analyticsId } = req.params;

    // Validate if the provided id is a valid ObjectId
    if (!mongoose.isValidObjectId(analyticsId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const analytics = await Analytics.findById(analyticsId);

      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      await analytics.deleteOne(); // Replacing the deprecated `remove()` method
      res.json({ message: "Analytics deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while deleting analytics" });
    }
  },
};
