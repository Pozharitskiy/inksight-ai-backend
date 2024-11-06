require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/mongo");

const assistantRouter = require("./routers/assistant");
const analyzeImageRouter = require("./routers/analyze-image");
const generateTattooRouter = require("./routers/generate-tattoo");
const usersRouter = require("./routers/users");
const generatesRouter = require("./routers/generations");
const authRouter = require("./routers/auth");
const analyticsRouter = require("./routers/analytics");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use("/uploads", express.static("uploads"));
connectDB();

app.use("/assistant", assistantRouter);
app.use("/analyze-image", analyzeImageRouter);
app.use("/generate-tattoo", generateTattooRouter);
app.use("/users", usersRouter);
app.use("/generations", generatesRouter);
app.use("/auth", authRouter);
app.use("/analytics", analyticsRouter);

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
