const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  bio: String,
  scores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Score' }]
});

module.exports = mongoose.model('User', userSchema);