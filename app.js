const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'quiz_secret', resave: false, saveUninitialized: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

const USERS_FILE = path.join(__dirname, 'users.json');
const questionsData = require('./questions.json');

// Signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
  }
  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.send('Username already exists. <a href="/signup">Try again</a>.');
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  req.session.username = username;
  res.redirect('/');
});

// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
  const validUser = users.find(u => u.username === username && bcrypt.compareSync(password, u.password));
  if (!validUser) {
    return res.send('Invalid login. <a href="/login">Try again</a>.');
  }
  req.session.username = username;
  res.redirect('/');
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Middleware to protect /quiz
app.use('/quiz', (req, res, next) => {
  if (!req.session.username) {
    return res.redirect('/login');
  }
  next();
});


// Home page
app.get('/', (req, res) => {
  if (!req.session.username) {
    return res.redirect('/login');
  }
  res.render('home', { darkMode: true });
});


// Start quiz
app.post('/quiz', (req, res) => {
  const name = req.body.username || req.session.username || 'Guest';
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

// Submit quiz
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
