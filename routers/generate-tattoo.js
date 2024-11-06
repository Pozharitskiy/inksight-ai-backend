const express = require("express");
const router = express.Router();
const {
  OnGenerateTattoo,
  OnGenerateTattoName,
} = require("../controllers/generate-tattoo");

router.post("/", OnGenerateTattoo);
router.get("/suggestion", OnGenerateTattoName);

module.exports = router;
