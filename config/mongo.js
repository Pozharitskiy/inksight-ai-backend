const mongoose = require("mongoose");
const { Config } = require("./config");

const connectDB = async () => {
  try {
    await mongoose.connect(Config.mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
