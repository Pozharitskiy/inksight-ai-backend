const {
  generateTattooCustom,
  generateTattoSuggestion,
} = require("../helpers/generateTattoo");

const { OpenAI } = require("openai");
const Generations = require("../models/Generations");
const Task = require("../models/Task");
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

const processTask = async (taskId) => {
  try {
    // Получаем задачу из базы данных
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    // 4. Генерация изображений
    const imageUrls = await generateTattooCustom(task.prompt, taskId);

    // 5. Поиск или создание пользователя по deviceId
    let user = null;
    if (task.deviceId) {
      user = await User.findOne({ deviceId: task.deviceId });
      if (!user) {
        user = new User({ deviceId: task.deviceId });
        await user.save();
      }
    }

    // 6. Сохранение изображений локально
    const uploadsFolder = path.resolve(__dirname, "../uploads");
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }

    const localImagePaths = await Promise.all(
      imageUrls.map((url) => downloadImage(url, uploadsFolder))
    );

    // 7. Сохранение данных о генерации татуировки в базе данных
    const generated = new Generations({
      images: localImagePaths,
      prompt: task.prompt,
      userId: user._id,
    });

    await generated.save();

    // 8. Обновляем задачу с результатами (ссылки на изображения)
    await Task.findByIdAndUpdate(taskId, {
      status: "completed",
      images: localImagePaths,
    });

    // (Не обязательно) — можно вернуть результат генерации пользователю
    console.log("Tattoo generation completed successfully");

  } catch (error) {
    console.error("Error processing task:", error);
    await Task.findByIdAndUpdate(taskId, { status: "failed" });
  }
};


module.exports = {
  OnGenerateTattoo: async (req, res) => {
    const { prompt, wishes, deviceId } = req.body;
  
    try {
      const task = new Task({
        deviceId,
        prompt,
        wishes,
        status: "pending",
        images: [],
        retryCount: 0,
        generationId: null,
      });
  
      await task.save();
  
      console.log(`[${task._id}] Task created, returning taskId to client.`);
  
      const taskId = await generateTattooCustom(task.prompt);
  
      await Task.findByIdAndUpdate(task._id, {
        generationId: taskId,
      });
  
      res.json({ taskId: task._id });
  
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  },  
  onGetTaskResult: async (req, res) => {
    const { taskId } = req.params;

    try {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({
        taskId: task._id,
        status: task.status,
        images: task.images,
      });

    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task result" });
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
