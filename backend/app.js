const express = require("express");
const session = require("express-session");
const cors = require("cors");

const app = express();

// Use CORS to allow requests from the frontend
app.use(cors({
  origin: 'http://localhost:3000', // Adjust this to match your frontend
  credentials: true, // This ensures that session cookies can be shared
}));

app.use(session({
  secret: 'casino-secret',
  resave: false,
  saveUninitialized: false, // Changed this to avoid initializing unused sessions
  cookie: { 
      sameSite: 'none', // To allow cross-origin cookies
      secure: false // Set to true if using HTTPS in production
  }
}));

// Symbols and rewards
const symbols = ["C", "L", "O", "W"];
const rewards = {
  C: 10,
  L: 20,
  O: 30,
  W: 40,
};

// Start session - Initialize credits
app.get("/start-session", (req, res) => {
  if (!req.session.credits) {
    // Initialize only if credits don't exist
    req.session.credits = 10;
  }
  res.json({ message: "Session started", credits: req.session.credits });
});

// Roll slots
app.get("/roll", (req, res) => {
  // Check if session and credits exist
  if (!req.session.credits || req.session.credits <= 0) {
    return res.json({
      message: "No credits left",
      credits: req.session.credits || 0,
    });
  }

  // Deduct 1 credit
  req.session.credits -= 1;

  // Random symbols
  let slotResults = [
    symbols[Math.floor(Math.random() * 4)],
    symbols[Math.floor(Math.random() * 4)],
    symbols[Math.floor(Math.random() * 4)],
  ];

  // Check if player wins (all three symbols match)
  let win =
    slotResults[0] === slotResults[1] && slotResults[1] === slotResults[2];

  // Cheating logic: 30% re-roll if credits between 40-60, 60% if above 60
  if (win) {
    const reward = rewards[slotResults[0]];

    let rerollChance = 0;
    if (req.session.credits >= 40 && req.session.credits < 60) {
      rerollChance = 0.3;
    } else if (req.session.credits >= 60) {
      rerollChance = 0.6;
    }

    // If house cheats, re-roll
    if (Math.random() < rerollChance) {
      slotResults = [
        symbols[Math.floor(Math.random() * 4)],
        symbols[Math.floor(Math.random() * 4)],
        symbols[Math.floor(Math.random() * 4)],
      ];
      win = false; // Server cheated, player doesn't win this round
    }

    // If still a win after cheating, give reward
    if (win) {
      req.session.credits += reward;
    }
  }

  // Return the updated slot results and credit count
  res.json({ slots: slotResults, win, credits: req.session.credits });
});

// Cash-out endpoint
app.get("/cash-out", (req, res) => {
  console.log(`User cashed out with ${req.session.credits} credits`);
  req.session.destroy();
  res.json({ message: "Cashed out" });
});

// Reset session - Reinitialize credits
app.get('/reset-session', (req, res) => {
  req.session.credits = 10; // Reset credits to 10
  res.json({ message: 'Session reset', credits: req.session.credits });
});

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
