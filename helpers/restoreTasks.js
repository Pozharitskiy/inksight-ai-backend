const Task = require("../models/Task");

const restoreUnfinishedTasks = async () => {
  const unfinishedTasks = await Task.find({
    status: { $in: ["pending", "in-progress"] },
  });

  unfinishedTasks.forEach(async (task) => {
    // Restart the image generation process for unfinished tasks
    await generateTattooCustom(task.prompt, task._id);
  });
};

module.exports = { restoreUnfinishedTasks }; 