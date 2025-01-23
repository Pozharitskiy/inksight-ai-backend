const XLSX = require("xlsx");
const axios = require("axios");
const { OpenAI } = require("openai");
const { assistant } = require("./gpt-4o-assistant");
const { pollForMessages } = require("./pollForMessages");
const { searchInterpretationNew } = require("./newSearch");
const { getBase64 } = require("./base64");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

const crocodileSearch = (inputText, inputSearchQuery) => {
  if (!inputText || !inputSearchQuery) {
    return 0;
  }

  let counter = 0;
  const text = inputText.toLowerCase().trim();
  const searchQuery = inputSearchQuery.toLowerCase().trim();

  for (let i = 0; i < text.length; i++) {
    if (text[i] === searchQuery[counter]) {
      counter++;
    }
  }

  return counter;
};

const recognizeInterpretation = async (image) => {
  const base64 = getBase64(image);

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What’s tattoo in this image? answer withot description just what is it in one or two words",
          },
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

  return chatCompletion?.choices?.[0]?.message?.content;
};

function searchInterpretation(data, searchQuery) {
  if (!searchQuery?.length) {
    return null;
  }

  let maxEqualitiesPercent = 0;
  let maxEqualities = 0;
  let bestMatchInput = "";
  let bestMatch = null;

  for (let row of data) {
    const targetWord = row["Tatoo (eng)"]?.replace(" (w)", "");
    const equalities = crocodileSearch(targetWord, searchQuery);

    // console.log(targetWord, equalities / targetWord?.length);

    if (
      equalities > maxEqualities &&
      maxEqualitiesPercent < equalities / targetWord?.length
    ) {
      const isMathEng = equalities / targetWord?.length >= 0.75;

      if (isMathEng) {
        maxEqualities = equalities;
        maxEqualitiesPercent = equalities / targetWord?.length;
        bestMatchInput = targetWord;
        bestMatch = row["Output Interpretation"];
      }
    }
  }

  console.log("bestMatchInput", bestMatchInput, searchQuery);

  return bestMatch;
}

const readSheetData = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  return data;
};

const getImageMatch = async ({ version, base64Image, customUserPrompt }) => {
  try {
    console.log("GPT-4 VISION IN DEAL");

    let systemPrompt =
      "You are an application that gives a psychological interpretation of a person's tattoos. (without text decoration). Please address the user as the person who wants to know why they choose that tattoo. on English.";
    let userPrompt = "what does this tattoo can say about me?";

    console.log("CURRENT VERSION", version);

    if (version === "v2" || version === "v3") {
      systemPrompt = `You are an application that gives a psychological interpretation of a person's tattoos. (without text decoration). Please address the user as the person who wants to know why they choose that tattoo. on English. And extremelly important. you should answer only as json message because I send you response directly to app for parsing, example of json you answer {"analytic":"text minimum 700 characters minimum 3 newlines !important!","TopThreePersonality":[{"label":"Wisdom","emoji":"🦉"},{"label":"Calmless","emoji":"🪷"},{"label":"Realibity","emoji":"🛡️"}],"PrimaryColors":[{"name":"black","hex":"#000000","percentage":"50%"},{"name":"white","hex":"#ffffff","percentage":"50%"}],"primaryColorsAnalytics":"text"}`;
    }

    if (customUserPrompt?.length) {
      userPrompt = customUserPrompt;
    }

    console.log("GPT-4 vision system prompt", systemPrompt);
    console.log("GPT-4 vision user prompt", userPrompt);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GPT_API_KEY}`,
    };

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `${base64Image}`,
              },
            },
            {
              type: "text",
              text: userPrompt,
            },
          ],
        },
      ],
      max_tokens: 1000,
    };

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      { headers }
    );
    const result = response.data.choices[0].message.content;

    console.log("GPT4 vision result", result);

    return result;
  } catch (error) {
    console.error(error);
  }
};

async function getResult(value, threadId) {
  await openai.beta.assistants.update("asst_Lv7NNc7xEa4xgZZfDJVNqRXT", {
    instructions:
      "You are an application that gives a psychological interpretation of a person's tattoos. (without text decoration). Please address the user as the person who wants to know why they choose that tattoo. on English",
  });

  const isWithDescription = value?.split(" ")?.length > 5;
  let prompt = isWithDescription
    ? `what this tattoo can say about me? answer. here is data for help ${value}`
    : `what can ${value} tattoo say about me?`;

  if (!value?.length) {
    prompt = "what can this tattoo say about me";
  }

  // ask assistant
  try {
    await assistant([{ type: "text", text: prompt }], threadId);

    const messageFromAssistant = await new Promise((resolve, reject) => {
      pollForMessages(openai, threadId, resolve, reject);
    });

    const result =
      messageFromAssistant?.content?.[0]?.text?.value ||
      "No response from assistant.";

    return result;
  } catch (err) {
    console.log(err?.data);
  }
}

const myAssistant = async ({ image, threadId, version }) => {
  const filePath = "./helpers/InkSight AI eng.xlsx";
  const data = readSheetData(filePath);

  const interpretation = await recognizeInterpretation(image);
  let tattooDescription = searchInterpretationNew(data, interpretation);

  if (image) {
    if (tattooDescription) {
      tattooDescription = await getImageMatch({
        version,
        base64Image: image,
        customUserPrompt: `what does this tattoo can say about me? answer. here data for help ${tattooDescription}`,
      });
    } else {
      tattooDescription = await getImageMatch({ version, base64Image: image });
    }

    return tattooDescription;
  }

  if (!tattooDescription) {
    tattooDescription = interpretation;
  }

  console.log("final result", tattooDescription);

  return await getResult(tattooDescription, threadId);
};

module.exports = { myAssistant };
