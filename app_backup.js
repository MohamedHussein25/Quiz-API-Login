
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'quiz_secret',
  resave: false,
  saveUninitialized: true
}));

const questionsData = require('./questions.json');

app.get('/', (req, res) => {
  res.render('home', { darkMode: true });
});

app.post('/quiz', (req, res) => {
  const name = req.body.username || 'Guest';
  const count = parseInt(req.body.count) || 10;

  const shuffled = questionsData.sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffled.slice(0, count).map(q => ({
    question: q.question,
    options: [
      { key: 'A', text: q.A },
      { key: 'B', text: q.B },
      { key: 'C', text: q.C },
      { key: 'D', text: q.D }
    ],
    answer: q.answer
  }));

  req.session.questions = selectedQuestions;
  req.session.username = name;

  res.render("quiz", {
  darkMode: true,
    questions: selectedQuestions,
    username: name
  });
});

app.post('/submit', (req, res) => {
  const userAnswers = req.body;
  const { username, questions } = req.session;
  let score = 0;

  if (!questions) {
    return res.redirect('/');
  }

  questions.forEach((q, i) => {
    const userAnswer = userAnswers[`q${i}`];
    if (userAnswer === q.answer) {
      score++;
    }
  });

  const scoresPath = './scores.json';
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const result = {
    username: username || 'Guest',
    score: score,
    total: questions.length,
    timestamp
  };

  let scoreData = [];
  try {
    if (fs.existsSync(scoresPath)) {
      const raw = fs.readFileSync(scoresPath);
      scoreData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Read error:', err);
  }

  scoreData.push(result);
  fs.writeFileSync(scoresPath, JSON.stringify(scoreData, null, 2));

  let history = [];
  try {
    if (fs.existsSync(scoresPath)) {
      const raw = fs.readFileSync(scoresPath);
      history = JSON.parse(raw).filter(s => s.username === result.username);
    }
  } catch (err) {
    console.error('History read error:', err);
  }

  res.render('result', { result, history, darkMode: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
