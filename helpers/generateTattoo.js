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
  console.log("Generating tattoo with prompt:", prompt);

  try {
    // Update task status to 'in-progress'
    await Task.findByIdAndUpdate(taskId, {
      status: "in-progress",
    });

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

    console.log("Task result:", taskResult?.data?.data?.prompt);
    const taskIdResult = taskResult.data?.data?.id;
    let result = null;
    // let retryCount = 0;
    // const maxRetries = 3;

    // Retry logic
    while (!result?.upscaled_urls?.length) {
      const response = await axios.get(
        `https://cl.imagineapi.dev/items/images/${taskIdResult}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.IMAGINE_API_KEY}`,
          },
        }
      );

      console.log(response.data.data.status);

      if (response.data.data.status === "completed") {
        result = response?.data?.data;
      }

      if (response.data.data.status === "failed") {
        throw new Error("Task failed");
      }

      if (!result?.upscaled_urls?.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retrying
      }
    }

    // If images are successfully generated, save them to the Task and return URLs
    if (result && result.upscaled_urls?.length > 0) {
      await Task.findByIdAndUpdate(taskId, {
        status: "completed",
        images: result.upscaled_urls,
      });

      return result.upscaled_urls;
    }

    // If no images were found, mark task as failed
    await Task.findByIdAndUpdate(taskId, { status: "failed" });
    throw new Error("No upscaled URLs found");

  } catch (error) {
    console.error("Error generating tattoo images:", error);

    // Mark task as failed in case of an error
    await Task.findByIdAndUpdate(taskId, { status: "failed" });

    throw new Error("An error occurred while generating the tattoo images.");
  }
};


// const generateTattooCustom = async (prompt) => {
//   console.log('I AM GENERATING', prompt)

//   try {
//     // const taskResult = await axios.post(
//     //   "https://cl.imagineapi.dev/items/images/",
//     //   {
//     //     prompt: `a high-quality tattoo design ${prompt} PNG format, white solid background.`,
//     //   },
//     //   {
//     //     headers: {
//     //       Authorization: `Bearer ${process.env.IMAGINE_API_KEY}`,
//     //     },
//     //   }
//     // );

//     // console.log("taskResult", taskResult);

//     // const taskId = taskResult.data?.data?.id;
    
//     // let result = null;

//     // while (!result?.upscaled_urls?.length) {
//     //   const response = await axios.get(
//     //     `https://cl.imagineapi.dev/items/images/${taskId}`,
//     //     {
//     //       headers: {
//     //         Authorization: `Bearer ${process.env.IMAGINE_API_KEY}`,
//     //       },
//     //     }
//     //   );
//     //   console.log(response.data.data.status)

//     //   if (response.data.data.status === "completed") {
//     //     result = response?.data?.data;
//     //   }

//     //   if (response.data.data.status === "failed") {
//     //     throw new Error("Task failed");
//     //   }

//     //   await new Promise((resolve) => setTimeout(resolve, 2000));
//     // }

//     console.log(result)
//     // return result.upscaled_urls;
//     return [
//       'https://cl.imagineapi.dev/assets/e51355d1-365c-457c-b0a2-c9abd502295b/e2ec3901-68c2-496f-a3c0-ebbbfc27d954.png',
//       'https://cl.imagineapi.dev/assets/e84f2601-0c40-4e23-a41e-9e19372347f3/79ed9adc-8ff2-4e80-8804-77b359f92133.png',
//       'https://cl.imagineapi.dev/assets/db0b4c3d-d053-47c3-a9c3-58f9137032c3/a17f47b5-0ccb-4400-bd8a-5647add50a52.png',
//       'https://cl.imagineapi.dev/assets/980a4351-6536-4427-acd6-6d93473494a7/5332435e-812d-4d00-b4d9-9e9b34b06ab1.png'
//     ];
//   } catch (error) {}
// };

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
