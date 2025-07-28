const express = require('express');
const router = express.Router();
const User = require('../models/User'); // 使用 Mongoose 的 User 模型

// 检查是否已登录
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const allUsers = await User.find({}, 'username maxScore').sort({ maxScore: -1 });

    const leaderboard = allUsers.map((user, index) => ({
      rank: index + 1,
      name: user.username,
      maxScore: user.maxScore || 0,
      isCurrentUser: user._id.toString() === req.session.userId,
    }));

    res.render('leaderboard', {
      leaderboard,
      currentUserName: req.session.username || 'You',
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
