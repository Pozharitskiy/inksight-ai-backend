const {
  generateTattooCustom,
  generateTattoSuggestion,
} = require("../helpers/generateTattoo");

const { OpenAI } = require("openai");
const Generated = require("../models/Generations");
const User = require("../models/User");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // For generating unique filenames
const sharp = require("sharp");

const whiteThreshold = 240;

const downloadImage = async (url, folder) => {
  const filename = `${uuidv4()}.png`; // Save as PNG to preserve transparency
  const filepath = path.resolve(folder, filename);

  // Fetch image from URL
  const response = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer",
  });

  const buffer = Buffer.from(response.data); // Convert image data to buffer

  // Load the image into Sharp and get raw pixel data
  const { data, info } = await sharp(buffer)
    .ensureAlpha() // Make sure image has an alpha channel
    .raw() // Extract raw pixel data (RGBA format)
    .toBuffer({ resolveWithObject: true });

  const pixelData = Buffer.from(data);
  const pixelCount = info.width * info.height;

  // Iterate over each pixel and replace white-like colors with transparency
  for (let i = 0; i < pixelCount; i++) {
    const r = pixelData[i * 4];
    const g = pixelData[i * 4 + 1];
    const b = pixelData[i * 4 + 2];

    // Calculate luminance based on the RGB values (simplified formula)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // If the pixel is close to white, make it transparent
    if (luminance >= whiteThreshold) {
      pixelData[i * 4 + 3] = 0; // Set alpha channel to 0 (fully transparent)
    }
  }

  // Recreate the image from the modified pixel data and save as PNG
  await sharp(pixelData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4, // 4 channels: RGBA
    },
  })
    .png() // Ensure output format is PNG for transparency support
    .toFile(filepath); // Save the image with the white background removed

  return `/uploads/${filename}`; // Returning relative path for later use
};

const askUser = async (prompt, question) => {
  // question: color, style, anything else

  const openai = new OpenAI({
    apiKey: process.env.GPT_API_KEY,
  });

  let data = {};

  switch (question) {
    case "color":
      data = {
        role: "user",
        content: [
          {
            type: "text",
            text: "Ask user about color of this tattoo based on last answers to collect info",
          },
        ],
      };
      break;
    case "style":
      data = {
        role: "user",
        content: [
          {
            type: "text",
            text: "Ask user about style of this tattoo based on last answers to collect info",
          },
        ],
      };
      break;
    case "anything else":
      data = {
        role: "user",
        content: [
          {
            type: "text",
            text: "Ask user about anything else of this tattoo based on last answers to collect info",
          },
        ],
      };
      break;
    default:
      data = {
        role: "user",
        content: [
          {
            type: "text",
            text: "Ask user about tattoo based on last answers to collect info",
          },
        ],
      };
      break;
  }

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "you are program that will help to user to generate tattoo based on his story, you will be ask user about tattoo to collect more information based on last answers",
      },
      {
        role: "user",
        content: prompt,
      },
      data,
    ],
    model: "gpt-4o-mini",
  });

  return chatCompletion?.choices?.[0]?.message?.content;
};

module.exports = {
  OnGenerateTattoo: async (req, res) => {
    const { prompt, wishes, count, deviceId } = req.body;

    try {
      // Generate images (get external URLs)
      const imageUrls = await generateTattooCustom(
        prompt + wishes ? ` additional wishes: ${wishes}` : "",
        count
      );

      // If userId is provided, find or create user, otherwise assign 'unknown'
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

      // Directory to store the downloaded images
      const uploadsFolder = path.resolve(__dirname, "../uploads");
      if (!fs.existsSync(uploadsFolder)) {
        fs.mkdirSync(uploadsFolder, { recursive: true }); // Ensure uploads directory exists
      }

      // Download the generated images and store them locally
      const localImagePaths = await Promise.all(
        imageUrls.map((url) => downloadImage(url, uploadsFolder))
      );

      // Create a Generated object with local image paths
      const generated = new Generated({
        images: localImagePaths, // Save the local paths to the images
        prompt,
        userId: user._id,
      });

      // Save the generated tattoo data
      await generated.save();

      // Add the generation to the user's generations array
      user.generations.push(generated._id);
      await user.save();

      // Send response back with the generated object (including local image paths)
      res.json(generated);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while generating and saving tattoo images",
      });
    }
  },

  OnGenerateTattoName: async (req, res) => {
    try {
      const result = await generateTattoSuggestion();
      res.json({ result });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while generating tattoo suggestion",
      });
    }
  },

  onChat: async (req, res) => {
    const { prompt, question } = req.body;

    try {
      const result = await askUser(prompt, question);
      res.json({ result });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while asking user",
      });
    }
  },
};
