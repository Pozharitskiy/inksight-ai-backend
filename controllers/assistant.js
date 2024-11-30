const { myAssistant } = require("../helpers/assistant-v4");
const User = require("../models/User");
const Analytics = require("../models/Analytics");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Function to save image from base64 to file storage
const saveImage = async (base64Image) => {
  const uploadsFolder = path.resolve(__dirname, "../uploads");
  if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder, { recursive: true });
  }

  const fileName = `${uuidv4()}.png`;
  const filePath = path.join(uploadsFolder, fileName);

  // Extract base64 data and write it to a file
  const base64Data = base64Image
    .replace(/^data:image\/png;base64,/, "")
    .replace(/^data:image\/jpeg;base64,/, "");
  fs.writeFileSync(filePath, base64Data, "base64");

  return `/uploads/${fileName}`; // Return the relative path for the image
};

module.exports = {
  OnAnalyze: async (req, res) => {
    const { prompt, image, version, threadId, deviceId } = req.body;

    try {
      // Step 1: Handle user retrieval or creation
      let user = null;
      if (deviceId) {
        user = await User.findOne({ deviceId });
        if (!user) {
          user = new User({ deviceId });
          await user.save();
        }
      } else {
        user = await User.findOne({ deviceId: "unknown" });
        if (!user) {
          user = new User({ deviceId: "unknown" });
          await user.save();
        }
      }

      // Step 2: Process the prompt and image with myAssistant
      const result = await myAssistant({
        tatto: prompt,
        image,
        threadId,
        version,
      });

      // Step 3: Save the image from base64 to the file system
      const savedImagePath = await saveImage(image);

      // Step 4: Create the analytics object
      const newAnalytics = new Analytics({
        image: savedImagePath,
        result, // The result returned by myAssistant
        userId: user._id,
        prompt,
        version,
        threadId,
      });

      // Save the analytics object
      await newAnalytics.save();

      // Step 5: Update user's analytics count (if you need to track count)
      user.analyzes = (user.analyzes || 0) + 1; // Increment analytics count
      await user.save();

      if (version == "v2") {
        return res.json(result);
      }

      res.json(newAnalytics);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred during analysis" });
    }
  },
};
