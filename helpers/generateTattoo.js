const { default: axios } = require("axios");
const { OpenAI } = require("openai");
const Generations = require("../models/Generations");
const Task = require("../models/Task");
require("dotenv").config();

const generateTattooDalle = async (prompt, count = 4) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.GPT_API_KEY,
    });

    const generateSingleImage = async () => {
      const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: `a high-quality ${prompt} tattoo design PNG format, white solid background.`,
        n: 1,
        size: "256x256",
        quality: "standard",
      });
      return response.data[0].url;
    };

    const imagePromises = Array(count)
      .fill()
      .map(() => generateSingleImage());
    const image_urls = await Promise.all(imagePromises);

    return image_urls;
  } catch (error) {
    console.error("Error generating tattoo images:", error);
    throw error;
  }
};

const generateTattooCustom = async (prompt, taskId) => {
  console.log(`Processing task: ${taskId} with prompt: ${prompt}`);

  try {
    // Отправляем запрос на генерацию
    const taskResult = await axios.post(
      "https://cl.imagineapi.dev/items/images/",
      {
        prompt: `a high-quality tattoo design ${prompt} PNG format, white solid background.`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.IMAGINE_API_KEY}`,
        },
      }
    );

    const taskIdResult = taskResult.data?.data?.id;
    let result = null;
    let attempts = 0;
    const maxAttempts = 12;

    while (!result?.upscaled_urls?.length && attempts < maxAttempts) {
      attempts++;

      const response = await axios.get(
        `https://cl.imagineapi.dev/items/images/${taskIdResult}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.IMAGINE_API_KEY}`,
          },
        }
      );

      if (response.data.data.status === "completed") {
        result = response.data.data;
      } else if (response.data.data.status === "failed") {
        throw new Error("Task failed");
      }

      if (!result?.upscaled_urls?.length) {
        console.log(`Retrying... (${attempts}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // Если картинки сгенерированы — возвращаем URL изображений
    if (result && result.upscaled_urls?.length > 0) {
      return result.upscaled_urls;
    }

    // Если не получилось — возвращаем null, задача будет обновлена в `processTask`
    return null;

  } catch (error) {
    console.error(`Error generating tattoo images for task ${taskId}:`, error);
    return null; // Ошибка, задача будет обновлена в `processTask`
  }
};

const generateTattoSuggestion = async () => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GPT_API_KEY}`,
    };

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            'You are program that generate random tatto suggestion and answer only suggetion without descriptions and dont suggest "Phoenix". for example: "Horse on the Moon" or "Spider on Web" or "Knife with blood"',
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Generate random tattoo suggestion",
            },
          ],
        },
      ],
      max_tokens: 100,
    };

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      { headers }
    );
    const result = response.data.choices[0].message.content;

    return result;
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  generateTattoSuggestion,
  generateTattooCustom,
  generateTattooDalle,
};
