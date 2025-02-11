const mongoose = require("mongoose");
const Generated = require("../models/Generations"); // Assuming this is the model for tattoo generations

const queue = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;

  while (queue.length > 0) {
    const { req, res } = queue.shift(); // Get the next request
    await handleRequest(req, res); // Process the request
  }

  isProcessing = false;
};

const addToQueue = async (req, res) => {
  // Save the request to MongoDB
  const requestData = {
    prompt: req.body.prompt,
    wishes: req.body.wishes,
    count: req.body.count,
    deviceId: req.body.deviceId,
  };

  const request = new Generated(requestData); // Create a new request document
  await request.save(); // Save to MongoDB

  queue.push({ req, res });
  processQueue(); // Start processing the queue
};

const handleRequest = async (req, res) => {
  // Call the original OnGenerateTattoo function
  const { OnGenerateTattoo } = require("../controllers/generate-tattoo");
  await OnGenerateTattoo(req, res);
};

module.exports = { addToQueue };