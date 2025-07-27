const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const questionsFile = path.join(__dirname, '../data/questions.json');

const Score = require('../models/Score');

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/quiz', (req, res) => {
  fs.readFile(questionsFile, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error loading questions');
    let questions = JSON.parse(data);
    questions = shuffle(questions).slice(0, 10);
    res.render('quiz', { questions, username: req.session.username || 'Guest' });
  });
});

router.post('/submit', (req, res) => {
  fs.readFile(questionsFile, 'utf-8', async (err, data) => {
    if (err) return res.status(500).send('Error loading answers');

    const questions = JSON.parse(data);
    const userAnswers = req.body;
    let score = 0;

    questions.forEach((q, idx) => {
      if (userAnswers[`q${idx}`] === q.answer) score++;
    });

    const usedTime = parseInt(userAnswers.usedTime || 0);
    const username = req.session.username || 'anonymous';

    try {
      await Score.create({ username, score, usedTime });

      const history = await Score.find({ username }).sort({ date: -1 }).limit(5);

      res.render('result', {
        score,
        usedTime,
        result: {
          username,
          score,
          total: questions.length,
          timestamp: new Date().toLocaleString()
        },
        history
      });

    } catch (e) {
      console.error('❌ Error saving score to MongoDB:', e);
      res.status(500).send('Error saving score');
    }
  });
});

module.exports = router;
