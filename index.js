require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/mongo");

const Task = require("./models/Task");

const assistantRouter = require("./routers/assistant");
const analyzeImageRouter = require("./routers/analyze-image");
const generateTattooRouter = require("./routers/generate-tattoo");
const usersRouter = require("./routers/users");
const generatesRouter = require("./routers/generations");
const authRouter = require("./routers/auth");
const analyticsRouter = require("./routers/analytics");
const articlesRouter = require("./routers/articles");
const articleCollectionsRouter = require("./routers/articleCollections");
const dictionaryRouter = require("./routers/dictionary");

const { getLastPendingTask } = require("./helpers/getLastPendingTask")

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
app.use("/articles", articlesRouter);
app.use("/article-collections", articleCollectionsRouter);
app.use("/dictionary", dictionaryRouter);
app.get('/tasks/lastPending', async (req, res) => {
  const { deviceId } = req.query;

  try {
    const task = await getLastPendingTask(deviceId);
    if (task) {
      return res.json(task);
    } else {
      return res.status(404).json({ error: 'No pending task found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching task' });
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
