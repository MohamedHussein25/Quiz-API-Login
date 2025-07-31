
const axios = require('axios');
const express = require('express'); 
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/User');
const Score = require('./models/Score');
const leaderboardRouter = require('./routes/leaderboard');
const submitRouter = require('./routes/submit');
const userRouter = require('./routes/user');
const questionsData = require('./questions.json');

const app = express();

mongoose.connect('mongodb+srv://userQuiz:Uq123456@cluster0.zgo4mqo.mongodb.net/quizAppDB?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

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
app.post('/quiz', async (req, res) => {
  const name = req.body.username || req.session.username || 'Guest';
  const count = parseInt(req.body.count) || 10;
  const category = req.body.category || '';

  try {
    const url = `https://opentdb.com/api.php?amount=${count}&type=multiple${category ? `&category=${category}` : ''}`;
    const response = await axios.get(url);

    const selected = response.data.results.map((q) => {
      const options = [...q.incorrect_answers, q.correct_answer]
        .sort(() => 0.5 - Math.random())
        .map((opt, i) => ({
          key: String.fromCharCode(65 + i),
          text: opt
        }));

      return {
        question: q.question,
        options,
        answer: options.find(opt => opt.text === q.correct_answer).key
      };
    });

    req.session.questions = selected;
    req.session.username = name;

    res.render("quiz", { darkMode: true, questions: selected, username: name });
  } catch (err) {
    console.error("Failed to load questions from Trivia API", err);
    res.status(500).send("Error fetching quiz questions.");
  }
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
