const express = require("express");
const router = express.Router();
const {
  OnGenerateTattoo,
  onGetTaskResult,
  OnGenerateTattoName,
  onChat,
} = require("../controllers/generate-tattoo");

router.post("/", OnGenerateTattoo);
router.get("/status/:taskId", onGetTaskResult);
router.get("/suggestion", OnGenerateTattoName);
router.post("/chat", onChat);

module.exports = router;
