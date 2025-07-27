const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/User');
const Score = require('./models/Score');

mongoose.connect('mongodb://127.0.0.1:27017/quizApp')
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'quiz_secret', resave: false, saveUninitialized: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

const questionsData = require('./questions.json');

// Signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send('Passwords do not match. <a href="/signup">Try again</a>.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await User.create({ username, password: hashedPassword });
    res.redirect('/login');
  } catch (err) {
    res.send('Username already exists. <a href="/signup">Try another</a>.');
  }
});

// Login route
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.send(`
      <script>alert('❌ User name not exist.'); window.location.href = '/login';</script>
    `);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.send(`
      <script>alert('❌ Password incorrect.'); window.location.href = '/login';</script>
    `);
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

// Submit quiz and save to MongoDB
app.post('/submit', async (req, res) => {
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

  const usedTime = parseInt(userAnswers.usedTime || 0);
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const result = {
    username: username || 'Guest',
    score,
    total: questions.length,
    timestamp
  };

  try {
    await Score.create({
      username: result.username,
      score: result.score,
      usedTime
    });

    const history = await Score.find({ username: result.username }).sort({ date: -1 }).limit(5);

    res.render('result', {
      result,
      history,
      darkMode: true
    });
  } catch (err) {
    console.error('MongoDB save/read error:', err);
    res.status(500).send('Error saving or reading score history.');
  }
});

// Capture undefined routes to prevent undefined errors
app.use((req, res) => {
  res.status(404).send(`
    <h2>404 Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Return to Home</a>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
