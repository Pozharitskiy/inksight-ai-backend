const { OpenAI } = require("openai");
const { getBase64 } = require("../helpers/base64");
const openai = new OpenAI({ apiKey: process.env.GPT_API_KEY });

module.exports = {
  OnAnalyze: async (req, res) => {
    try {
      const { image } = req.body;

      const base64 = getBase64(image);

      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What’s tattoo in this image? answer withot description just what is it in one or two words" },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        model: "gpt-4o-mini",
      });

      return res.json(chatCompletion?.choices?.[0]?.message?.content);
    } catch (error) {
      console.error("Error during analysis:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      // Ensure the file is deleted even if an error occurs
      try {
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    }
  },
};
