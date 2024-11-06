const express = require("express");
const controller = require("../controllers/analyze-image");

const router = express.Router();

router.post("/", controller.OnAnalyze);

module.exports = router;
