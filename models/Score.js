const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  username: String,
  score: Number,
  usedTime: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Score', scoreSchema);
