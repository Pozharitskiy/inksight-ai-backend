// webhookHandler.js
const Task = require('../models/Task');
const Generations = require('../models/Generations');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require("uuid"); // For generating unique filenames
const sharp = require("sharp");
const axios = require("axios");

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

const handleImagineApiWebhook = async (req, res, io) => {
  const { event, payload } = req.body;

  console.log("🔔 Webhook received:", payload);

  if (event === "images.items.update") {
    const { id, status, upscaled_urls, error } = payload;

    const task = await Task.findOne({ generationId: id });

    if (!task) {
      console.error(`❌ No matching task for ImagineAPI ID: ${id}`);
      return res.sendStatus(404);
    }

    if (status === "completed" && upscaled_urls?.length) {
      console.log("✅ Image ready:", upscaled_urls);

      const uploadsFolder = path.resolve(__dirname, "../uploads");
      if (!fs.existsSync(uploadsFolder)) {
        fs.mkdirSync(uploadsFolder, { recursive: true });
      }

      const localImagePaths = await Promise.all(
        upscaled_urls.map((url) => downloadImage(url, uploadsFolder))
      );

      const generated = new Generations({
        images: localImagePaths,
        prompt: task.prompt,
        userId: task.deviceId.toString(),
      });

      await generated.save();

      await Task.findByIdAndUpdate(task._id, {
        status: "completed",
        images: localImagePaths,
      });

      io.emit(`task_update_${task._id}`, { status: "completed", images: localImagePaths });
    } else if (status === "failed") {
      await Task.findByIdAndUpdate(task._id, { status: "failed" });
      io.emit(`task_update_${task._id}`, { status: "failed", error });
    }
  }

  res.sendStatus(200);
};

module.exports = { handleImagineApiWebhook };
