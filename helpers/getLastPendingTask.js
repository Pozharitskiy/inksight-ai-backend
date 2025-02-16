const Task = require("../models/Task");

const getLastPendingTask = async (deviceId) => {
    try {
      const task = await Task.findOne({
        deviceId: deviceId,
        status: { $in: ['in-progress', 'pending'] },  // Статус, который нас интересует
      }).sort({ createdAt: -1 });  // Сортируем по времени создания, чтобы взять последний
  
      return task;
    } catch (error) {
      console.error('Error fetching last pending task:', error);
      throw new Error('Failed to fetch last pending task');
    }
  };

  module.exports = { getLastPendingTask }