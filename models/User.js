const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  analyzes: { type: Number, default: 0 },
  generations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Generated" }],
  role: { type: String, enum: ["basic", "admin"], default: "basic" }, // Role field with default as 'basic'
  password: { type: String }, // Password field (only for admin)
});

// Hash the password before saving the user if it's new or modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password is not modified
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password validation method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
