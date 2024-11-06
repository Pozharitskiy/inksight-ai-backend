const pollForMessages = async (openai, threadId, resolve, reject) => {
  try {
    const threadMessages = await openai.beta.threads.messages.list(threadId);
    const latestMessage = threadMessages?.data?.[0];

    if (
      latestMessage &&
      latestMessage.role === "assistant" &&
      latestMessage.content[0]
    ) {
      resolve(latestMessage);
    } else {
      setTimeout(
        () => pollForMessages(openai, threadId, resolve, reject),
        1000
      );
    }
  } catch (error) {
    reject(error);
  }
};

module.exports = { pollForMessages };
