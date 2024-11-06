require("dotenv").config();

Config = {
  baseUrl: process.env.BASE_URL,
  mongoUrl: process.env.MONGO_URI,
  port: process.env.PORT,
  gptApiKey: process.env.GPT_API_KEY,
};

module.exports = { Config };
