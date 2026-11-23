const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const PASSWORD_SALT = "cyber-tetris-salt-v1";
const dataDir = process.env.CYBER_TETRIS_DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "tetris.db"));

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeUsername = (value) => String(value || "").trim();
const hashPassword = (password) => crypto.createHash("sha256").update(`${PASSWORD_SALT}:${String(password)}`).digest("hex");
const slugify = (value) => String(value || "").trim().replace(/\s+/g, "-").toLowerCase();

const toCsv = (rows) => {
  const headers = ["rank", "username", "email", "high_score", "last_score_at"];
  const lines = [headers.join(",")];
  rows.forEach((row, index) => {
    const values = [
      String(index + 1),
      `"${String(row.username ?? "").replace(/"/g, '""')}"`,
      `"${String(row.email ?? "").replace(/"/g, '""')}"`,
      String(row.score ?? 0),
      `"${String(row.last_score_at ?? "").replace(/"/g, '""')}"`
    ];
    lines.push(values.join(","));
  });
  return lines.join("\n");
};

const getLeaderboardRows = () => {
  const rows = db.prepare(`
    SELECT u.id, u.email, u.username, u.avatar, u.email_verified, s.score, s.created_at AS last_score_at
    FROM users u
    LEFT JOIN scores s ON s.user_id = u.id
    ORDER BY s.score DESC, s.created_at DESC, u.username ASC
  `).all();

  const map = new Map();
  rows.forEach((row) => {
    if (!row.id) return;
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        email: row.email,
        username: row.username,
        avatar: row.avatar || "default",
        email_verified: Boolean(row.email_verified),
        score: 0,
        last_score_at: null
      });
    }

    const current = map.get(row.id);
    const scoreValue = Number(row.score || 0);
    if (scoreValue > current.score) {
      current.score = scoreValue;
      current.last_score_at = row.last_score_at;
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return String(a.username).localeCompare(String(b.username));
  });
};

const userSafe = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  avatar: user.avatar || "default",
  email_verified: Boolean(user.email_verified)
});

const allLeaderboardRows = getLeaderboardRows;

app.use(express.json({ limit: "2mb" }));
const ensureSchema = () => {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT 'default',
      email_verified INTEGER NOT NULL DEFAULT 0,
      reset_token TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const columns = new Set(db.prepare("PRAGMA table_info(users)").all().map((column) => column.name));
  const requiredColumns = [
    ["password_hash", "TEXT"],
    ["avatar", "TEXT NOT NULL DEFAULT 'default'"],
    ["email_verified", "INTEGER NOT NULL DEFAULT 0"],
    ["reset_token", "TEXT"],
    ["updated_at", "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"]
  ];

  requiredColumns.forEach(([columnName, columnDefinition]) => {
    if (columns.has(columnName)) return;
    db.exec(`ALTER TABLE users ADD COLUMN ${columnName} ${columnDefinition}`);
    columns.add(columnName);
  });
};

ensureSchema();

const getUserByEmail = db.prepare(`SELECT * FROM users WHERE email = ?`);
const getUserById = db.prepare(`SELECT * FROM users WHERE id = ?`);
const createUser = db.prepare(`
  INSERT INTO users (email, username, password_hash, avatar, email_verified, reset_token, updated_at)
  VALUES (?, ?, ?, ?, 0, NULL, CURRENT_TIMESTAMP)
`);
const updateUser = db.prepare(`
  UPDATE users SET username = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
`);
const updatePassword = db.prepare(`
  UPDATE users SET password_hash = ?, reset_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = ?
`);
const markVerified = db.prepare(`UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?`);
const setResetToken = db.prepare(`UPDATE users SET reset_token = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?`);
const clearResetToken = db.prepare(`UPDATE users SET reset_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = ?`);
const deleteUser = db.prepare(`DELETE FROM users WHERE id = ?`);
const insertScore = db.prepare(`INSERT INTO scores (user_id, score) VALUES (?, ?)`);
const deleteUserScores = db.prepare(`DELETE FROM scores WHERE user_id = ?`);
const getUserBestScore = db.prepare(`
  SELECT u.id, u.email, u.username, u.avatar, u.email_verified, COALESCE(MAX(s.score), 0) AS score
  FROM users u
  LEFT JOIN scores s ON s.user_id = u.id
  WHERE u.id = ?
  GROUP BY u.id
`);
const getUsersOverview = db.prepare(`
  SELECT u.id, u.email, u.username, u.avatar, u.email_verified, COALESCE(MAX(s.score), 0) AS score, MAX(s.created_at) AS last_score_at
  FROM users u
  LEFT JOIN scores s ON s.user_id = u.id
  GROUP BY u.id
  ORDER BY score DESC, u.username ASC
`);

app.use(express.static(__dirname));

app.post("/api/signup", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const username = normalizeUsername(req.body.username);
  const password = String(req.body.password || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  if (!/^[a-zA-Z0-9 _-]{2,24}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 2–24 characters using letters, numbers, spaces, _ or -." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  if (getUserByEmail.get(email)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const existingUsername = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username);
  if (existingUsername) {
    return res.status(409).json({ error: "That username is already taken." });
  }

  try {
    createUser.run(email, username, hashPassword(password), "default");
    const user = getUserByEmail.get(email);
    res.json({ ...userSafe(user), password: undefined });
  } catch (error) {
    res.status(500).json({ error: "Unable to create the account right now." });
  }
});

app.post("/api/login", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const user = getUserByEmail.get(email);
  if (!user) {
    return res.status(401).json({ error: "No account matches that email." });
  }

  if (user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  res.json(userSafe(user));
});

app.post("/api/request-reset", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = getUserByEmail.get(email);
  if (!user) {
    return res.status(404).json({ error: "No account found for that email." });
  }

  const token = crypto.randomBytes(16).toString("hex");
  setResetToken.run(token, email);
  res.json({ success: true, token, message: "Reset token created. Use it in the reset-password request." });
});

app.post("/api/reset-password", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const token = String(req.body.token || "");
  const password = String(req.body.password || "");

  const user = getUserByEmail.get(email);
  if (!user || user.reset_token !== token) {
    return res.status(400).json({ error: "Invalid reset token." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  updatePassword.run(hashPassword(password), email);
  res.json({ success: true, message: "Password updated successfully." });
});

app.post("/api/verify-email", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = getUserByEmail.get(email);
  if (!user) return res.status(404).json({ error: "User not found." });
  markVerified.run(email);
  res.json({ success: true, verified: true, user: userSafe(getUserByEmail.get(email)) });
});

app.post("/api/scores", (req, res) => {
  const userId = Number(req.body.userId);
  const score = Math.floor(Number(req.body.score));

  if (!Number.isInteger(userId) || !Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: "Invalid score data." });
  }

  const user = getUserById.get(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  insertScore.run(userId, score);
  res.json({ saved: true });
});

app.get("/api/profile", (req, res) => {
  const userId = Number(req.query.userId);
  const email = normalizeEmail(req.query.email);

  if (Number.isInteger(userId) && userId > 0) {
    const user = getUserById.get(userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ ...userSafe(user), score: Number(getUserBestScore.get(userId)?.score || 0) });
  }

  if (email) {
    const user = getUserByEmail.get(email);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ ...userSafe(user), score: Number(getUserBestScore.get(user.id)?.score || 0) });
  }

  return res.status(400).json({ error: "Provide a userId or email." });
});

app.patch("/api/profile", (req, res) => {
  const userId = Number(req.body.userId);
  const username = normalizeUsername(req.body.username);
  const avatar = String(req.body.avatar || "default").slice(0, 32);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  if (!/^[a-zA-Z0-9 _-]{2,24}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 2–24 characters using letters, numbers, spaces, _ or -." });
  }

  const user = getUserById.get(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  updateUser.run(username, avatar || "default", userId);
  const updated = getUserById.get(userId);
  res.json(userSafe(updated));
});

app.delete("/api/profile", (req, res) => {
  const userId = Number(req.body.userId);
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  const user = getUserById.get(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  if (email && user.email !== email) return res.status(400).json({ error: "Email does not match." });
  if (password && user.password_hash !== hashPassword(password)) return res.status(401).json({ error: "Password is incorrect." });

  deleteUserScores.run(userId);
  deleteUser.run(userId);
  res.json({ success: true, deleted: true });
});

app.get("/api/admin/users", (req, res) => {
  res.json(getUsersOverview.all());
});

app.delete("/api/admin/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: "Invalid user id." });
  deleteUserScores.run(userId);
  deleteUser.run(userId);
  res.json({ success: true });
});

app.get("/api/leaderboard", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const period = String(req.query.period || "all").toLowerCase();
  const sort = String(req.query.sort || "score").toLowerCase();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(5, Number(req.query.limit || 10)));

  let rows = allLeaderboardRows();
  const now = Date.now();

  if (period === "weekly") {
    const cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    rows = rows.filter((row) => row.last_score_at && new Date(row.last_score_at) >= new Date(cutoff));
  } else if (period === "monthly") {
    const cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    rows = rows.filter((row) => row.last_score_at && new Date(row.last_score_at) >= new Date(cutoff));
  }

  if (search) {
    rows = rows.filter((row) => {
      const haystack = `${row.username || ""}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  if (sort === "score") {
    rows.sort((a, b) => Number(b.score) - Number(a.score));
  } else if (sort === "date") {
    rows.sort((a, b) => new Date(b.last_score_at || 0) - new Date(a.last_score_at || 0));
  } else if (sort === "name") {
    rows.sort((a, b) => String(a.username).localeCompare(String(b.username)));
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const pageRows = rows.slice(start, start + limit).map((row, index) => ({
    ...row,
    rank: start + index + 1,
    date: row.last_score_at || null
  }));

  res.json({ rows: pageRows, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Cyber Tetris running on http://${HOST}:${server.address().port}`);
});

module.exports = server;
