const express = require("express");
const router = express.Router();
const {
  OnGenerateTattoo,
  OnGenerateTattoName,
  onChat,
} = require("../controllers/generate-tattoo");

router.post("/", OnGenerateTattoo);
router.get("/suggestion", OnGenerateTattoName);
router.post("/chat", onChat);

module.exports = router;
