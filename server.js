const express = require('express');
const mongoose = require('mongoose');
const Task = require('./models/Task');

const app = express();
app.use(express.json()); 

mongoose.connect('mongodb+srv://islam:a8AW6Mmk8VSTdCSd@cluster0.74wfsh8.mongodb.net/?appName=Cluster0')
  .then(() => console.log('Успешно подключено к MongoDB Atlas'))
  .catch(err => console.error('Ошибка подключения к БД:', err));

app.get('/tasks/stats', async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = { todo: 0, inProgress: 0, done: 0 };
    stats.forEach(stat => {
      if (stat._id === 'todo') result.todo = stat.count;
      if (stat._id === 'in-progress') result.inProgress = stat.count;
      if (stat._id === 'done') result.done = stat.count;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/tasks/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Параметр запроса "q" обязателен' });
    }

    const tasks = await Task.find({ title: { $regex: q, $options: 'i' } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    const newTask = new Task({ title, description });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/tasks', async (req, res) => {
  try {
    const { sort } = req.query;
    let sortOptions = {};

    if (sort === 'asc') sortOptions.createdAt = 1;
    if (sort === 'desc') sortOptions.createdAt = -1;

    const tasks = await Task.find().sort(sortOptions);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Задача не найдена' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Неверный формат ID' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Задача не найдена' });
    res.json({ message: 'Задача успешно удалена', deletedId: task._id });
  } catch (error) {
    res.status(500).json({ error: 'Неверный формат ID' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту http://localhost:${PORT}`);
});
