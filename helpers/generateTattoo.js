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

const generateTattooCustom = async (prompt) => {
  console.log(`Processing prompt: ${prompt}`);

  try {
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
    if (!taskIdResult) {
      throw new Error("Failed to generate tattoo task");
    }

    console.log(`Task created with ID: ${taskIdResult}`);
    return taskIdResult; 
  } catch (error) {
    console.error(`Error generating tattoo images:`, error);
    return null;
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
