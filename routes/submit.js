const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const User = require('../models/User');

router.post('/submit', async (req, res) => {
  const { username, score, total } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send("User not found");

    const newScore = new Score({
      user: user._id,
      score: parseInt(score),
      total: parseInt(total)
    });

    await newScore.save();
    user.scores.push(newScore._id);
    await user.save();

    res.render('result', {
      username: user.username,
      score: newScore.score,
      total: newScore.total,
      date: newScore.date
    });
  } catch (err) {
    console.error("Error saving score:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;