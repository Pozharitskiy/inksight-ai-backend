const { default: axios } = require("axios");
const { OpenAI } = require("openai");
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
  try {
    const taskResult = await axios.post(
      "https://cl.imagineapi.dev/items/images/",
      {
        prompt: `a high-quality ${prompt} tattoo design PNG format, white solid background.`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.IMAGINE_API_KEY}`,
        },
      }
    );

    console.log("taskResult", taskResult);

    const taskId = taskResult.data?.data?.id;

    let result = null;

    while (!result?.upscaled_urls?.length) {
      const response = await axios.get(
        `https://cl.imagineapi.dev/items/images/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.IMAGINE_API_KEY}`,
          },
        }
      );

      if (response.data.data.status === "completed") {
        result = response?.data?.data;
      }

      if (response.data.data.status === "failed") {
        throw new Error("Task failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return result.upscaled_urls;
  } catch (error) {}
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
