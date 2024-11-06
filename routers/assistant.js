const express = require("express");
const controller = require("../controllers/assistant");

const router = express.Router();

router.post("/", controller.OnAnalyze);

module.exports = router;
