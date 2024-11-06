const User = require("../models/User");
const Generated = require("../models/Generations");

module.exports = {
  // Get all users with their generations populated
  getUsersWithGenerations: async (req, res) => {
    try {
      const items = await User.find().populate("generations");
      res.json({ results: items, count: items?.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while fetching users" });
    }
  },

  // Get a specific user by userId
  getUserById: async (req, res) => {
    const { userId } = req.params;

    try {
      // Find the user by userId and populate their generations
      const user = await User.findById(userId).populate("generations");

      // If user is not found, return 404
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return the full user data with populated generations
      res.json(user);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching the user" });
    }
  },

  // Get generations for a specific user by userId
  getGenerationsByUserId: async (req, res) => {
    const { userId } = req.params; // Extract userId from request params

    try {
      // Find the user by userId
      const user = await User.findById(userId).populate("generations");

      // If user doesn't exist, return 404
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return only the generations field from the user document
      res.json(user.generations);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while fetching generations for the user",
      });
    }
  },

  // Edit user (admin only)
  editUser: async (req, res) => {
    const { userId } = req.params;
    const { deviceId, role } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user details
      user.deviceId = deviceId || user.deviceId;
      user.role = role || user.role;

      await user.save();
      res.json({ message: "User updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update user" });
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res) => {
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await user.remove();
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
};
