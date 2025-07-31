const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post("/signup/submit", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const newUser = new User({ username, email, password });
    await newUser.save();
    console.log("✅ User created:", newUser);
    res.redirect("/login"); // Change if you want to redirect elsewhere
  } catch (err) {
    console.error("❌ Error saving user:", err);
    res.status(500).send("Signup failed");
  }
});

module.exports = router;