const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/User');
const Score = require('./models/Score');
const leaderboardRouter = require('./routes/leaderboard');
const questionsData = require('./questions.json');

mongoose.connect('mongodb://127.0.0.1:27017/quizApp')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'quiz_secret', resave: false, saveUninitialized: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Signup
app.get('/signup', (req, res) => res.render('signup'));

app.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Username already taken' });
  }
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashed });
  res.json({ success: true });
});

// Login
app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Username not found' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }
  req.session.username = username;
  req.session.userId = user._id.toString();
  res.json({ success: true });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Protect quiz route
app.use('/quiz', (req, res, next) => {
  if (!req.session.username) return res.redirect('/login');
  next();
});

// Home
app.get('/', (req, res) => {
  if (!req.session.username) return res.redirect('/login');
  res.render('home', { darkMode: true });
});

// Start Quiz
app.post('/quiz', (req, res) => {
  const name = req.body.username || req.session.username || 'Guest';
  const count = parseInt(req.body.count) || 10;
  const selected = questionsData.sort(() => 0.5 - Math.random()).slice(0, count).map(q => ({
    question: q.question,
    options: [
      { key: 'A', text: q.A },
      { key: 'B', text: q.B },
      { key: 'C', text: q.C },
      { key: 'D', text: q.D }
    ],
    answer: q.answer
  }));
  req.session.questions = selected;
  req.session.username = name;
  res.render("quiz", { darkMode: true, questions: selected, username: name });
});

// Submit Quiz
app.post('/submit', async (req, res) => {
  const { username, questions, userId } = req.session;
  if (!questions) return res.redirect('/');

  const answers = req.body;
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[`q${i}`] === q.answer) score++;
  });

  const usedTime = parseInt(answers.usedTime || 0);
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

  await Score.create({ username: username || 'Guest', score, usedTime });

  if (userId) {
    const user = await User.findById(userId);
    if (user && (user.maxScore === undefined || score > user.maxScore)) {
      user.maxScore = score;
      await user.save();
    }
  }

  const history = await Score.find({ username }).sort({ date: -1 }).limit(5);

  res.render('result', {
    result: { username, score, total: questions.length, timestamp },
    history,
    darkMode: true
  });
});

// Leaderboard
app.use('/leaderboard', leaderboardRouter);

// Profile Page
app.get('/profile', async (req, res) => {
  try {
    const username = req.session.username;
    if (!username) {
      return res.redirect('/login');
    }

    const scores = await Score.find({ username }).sort({ date: -1 });
    console.log('User:', username);
    console.log('Score history:', scores);

    res.render('profile', { username, scores });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.render('profile', { username: 'Guest', scores: [] });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <h2>404 Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Return to Home</a>
  `);
});

// Dynamic Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
