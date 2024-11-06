const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Admin registration
module.exports.registerAdmin = async (req, res) => {
  const { username, deviceId, password, secretKey } = req.body;

  // Ensure a secret key is provided for admin registration
  if (!secretKey || secretKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Invalid secret key" });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ deviceId: deviceId ?? username });
    if (userExists) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    // Create admin user
    const newUser = new User({
      deviceId,
      password,
      role: "admin",
    });

    await newUser.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register admin" });
  }
};

// Admin login (authentication)
module.exports.loginAdmin = async (req, res) => {
  const { username, deviceId, password } = req.body;

  try {
    const user = await User.findOne({ deviceId: deviceId ?? username });

    // Check if user exists and is admin
    if (!user || user.role !== "admin") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to authenticate admin" });
  }
};
