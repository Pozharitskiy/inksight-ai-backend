const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

// const assistant = async (fileId) => {
//   const myAssistant = await openai.beta.assistants.retrieve(
//     "asst_Lv7NNc7xEa4xgZZfDJVNqRXT"
//   );

//   await openai.beta.assistants.update("asst_Lv7NNc7xEa4xgZZfDJVNqRXT", {
//     instructions: "What is on the image? In 1 word",
//   });

//   const thread = await openai.beta.threads.create();
//   const message = await openai.beta.threads.messages.create(thread.id, {
//     role: "user",
//     content: [
//       {
//         type: "image_file",
//         image_file: {
//           file_id: fileId,
//         },
//       },
//     ],
//   });
//   const run = await openai.beta.threads.runs.create(thread.id, {
//     assistant_id: myAssistant.id,
//   });

//   return thread.id;
// };

const assistant = async (content, threadId = null) => {
  const defaultAssistantId = "asst_Lv7NNc7xEa4xgZZfDJVNqRXT";
  const myAssistant = await openai.beta.assistants.retrieve(defaultAssistantId);

  await openai.beta.assistants.update(defaultAssistantId, {
    instructions: "What is on the image? In 1 word",
  });

  if (!threadId) {
    const thread = await openai.beta.threads.create();
    threadId = thread.id;
  }

  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content,
  });
  await openai.beta.threads.runs.create(threadId, {
    assistant_id: myAssistant.id,
  });

  return threadId;
};

module.exports = { assistant };
