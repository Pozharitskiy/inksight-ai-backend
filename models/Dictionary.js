const mongoose = require("mongoose");

const dictionarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // if you want names to be unique in the collection
    },
    tags: {
      type: [String],
      default: [],
      required: false,
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    // Mongoose schema options
    timestamps: true, // adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Dictionary = mongoose.model("Dictionary", dictionarySchema);

module.exports = Dictionary;
