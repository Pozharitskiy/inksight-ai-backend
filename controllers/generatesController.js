const { default: mongoose } = require("mongoose");
const Generations = require("../models/Generations");

module.exports = {
  // Get all generated objects
  getAllGenerations: async (req, res) => {
    try {
      const items = await Generations.find().populate("userId", "deviceId");
      res.json({ results: items, count: items?.length });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching generated objects" });
    }
  },

  getById: async (req, res) => {
    const { id } = req.params;

    // Validate if the provided id is a valid ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      // Find the generation by its ID and populate userId with deviceId
      const item = await Generations.findById(id).populate(
        "userId",
        "deviceId"
      );

      // If the generation is not found, return a 404 error
      if (!item) {
        return res.status(404).json({ error: "Generation not found" });
      }

      // Return the found generation
      res.json(item);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching the generation" });
    }
  },

  // Edit a specific generation by ID (admin only)
  editGeneration: async (req, res) => {
    const { generationId } = req.params;
    const { prompt, images } = req.body;

    try {
      const generation = await Generations.findById(generationId);

      if (!generation) {
        return res.status(404).json({ error: "Generation not found" });
      }

      // Update generation fields
      if (prompt) generation.prompt = prompt;
      if (images && Array.isArray(images)) generation.images = images;

      await generation.save();
      res.json({ message: "Generation updated successfully", generation });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while updating generation" });
    }
  },

  // Delete a specific generation by ID (admin only)
  deleteGeneration: async (req, res) => {
    const { generationId } = req.params;

    // Validate if the provided id is a valid ObjectId
    if (!mongoose.isValidObjectId(generationId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const generation = await Generations.findById(generationId);

      if (!generation) {
        return res.status(404).json({ error: "Generation not found" });
      }

      // Delete the generation using deleteOne()
      await generation.deleteOne();
      res.json({ message: "Generation deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while deleting generation" });
    }
  },
};
