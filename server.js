require("dotenv").config();

const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "aquatrack",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}
function todayString() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.TZ || "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function dateTimeForNow() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: process.env.TZ || "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23"
  }).format(now);
  return parts.replace(" ", " ");
}
async function getSettings() {
  await pool.execute(
    "INSERT INTO user_settings (id, daily_goal_ml) VALUES (1, 2000) ON DUPLICATE KEY UPDATE id = id"
  );
  const [rows] = await pool.execute("SELECT daily_goal_ml FROM user_settings WHERE id = 1");
  return rows[0];
}
async function ensureDailySummary(date) {
  const settings = await getSettings();
  await pool.execute(
    `INSERT INTO daily_summaries (summary_date, goal_ml)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE summary_date = summary_date`,
    [date, settings.daily_goal_ml]
  );
  const [rows] = await pool.execute(
    "SELECT goal_ml FROM daily_summaries WHERE summary_date = ?", [date]
  );
  return rows[0].goal_ml;
}
function handleError(res, error) {
  console.error(error);
  if (error.code === "ER_NO_SUCH_TABLE" || error.code === "ECONNREFUSED" || error.code === "ER_BAD_DB_ERROR") {
    return res.status(503).json({ error: "Database unavailable. Check MySQL is running and schema.sql has been imported." });
  }
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/water", async (req, res) => {
  try {
    const date = req.query.date || todayString();
    if (!validDate(date)) return res.status(400).json({ error: "Use a valid date in YYYY-MM-DD format." });
    await ensureDailySummary(date);
    const [rows] = await pool.execute(
      `SELECT id, amount_ml, DATE_FORMAT(logged_at, '%Y-%m-%d %H:%i:%s') AS logged_at
       FROM water_logs
       WHERE DATE(logged_at) = ?
       ORDER BY logged_at DESC, id DESC`, [date]
    );
    const [totals] = await pool.execute(
      "SELECT COALESCE(SUM(amount_ml), 0) AS total_ml FROM water_logs WHERE DATE(logged_at) = ?", [date]
    );
    const [goals] = await pool.execute(
      "SELECT goal_ml FROM daily_summaries WHERE summary_date = ?", [date]
    );
    const goal = goals[0].goal_ml;
    const total = Number(totals[0].total_ml);
    res.json({ date, entries: rows, total_ml: total, goal_ml: goal,
      remaining_ml: Math.max(0, goal - total),
      progress_percent: Math.round((total / goal) * 100) });
  } catch (error) { handleError(res, error); }
});

app.post("/api/water", async (req, res) => {
  try {
    const amount = Number(req.body.amount_ml);
    const date = req.body.date || todayString();
    if (!Number.isInteger(amount) || amount <= 0 || amount > 10000) {
      return res.status(400).json({ error: "Enter a whole number between 1 and 10,000 ml." });
    }
    if (!validDate(date)) return res.status(400).json({ error: "Choose a valid date." });
    const loggedAt = req.body.logged_at || `${date} ${date === todayString() ? dateTimeForNow().split(" ")[1] : "12:00:00"}`;
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(loggedAt)) {
      return res.status(400).json({ error: "Invalid entry time." });
    }
    await ensureDailySummary(date);
    const [result] = await pool.execute(
      "INSERT INTO water_logs (amount_ml, logged_at) VALUES (?, ?)", [amount, loggedAt]
    );
    const [rows] = await pool.execute(
      "SELECT id, amount_ml, DATE_FORMAT(logged_at, '%Y-%m-%d %H:%i:%s') AS logged_at FROM water_logs WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json({ message: "Water entry saved.", entry: rows[0] });
  } catch (error) { handleError(res, error); }
});

app.put("/api/water/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const amount = Number(req.body.amount_ml);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid entry." });
    if (!Number.isInteger(amount) || amount <= 0 || amount > 10000) {
      return res.status(400).json({ error: "Enter a whole number between 1 and 10,000 ml." });
    }
    const [result] = await pool.execute("UPDATE water_logs SET amount_ml = ? WHERE id = ?", [amount, id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Water entry not found." });
    res.json({ message: "Water entry updated." });
  } catch (error) { handleError(res, error); }
});

app.delete("/api/water/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid entry." });
    const [result] = await pool.execute("DELETE FROM water_logs WHERE id = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Water entry not found." });
    res.json({ message: "Water entry deleted." });
  } catch (error) { handleError(res, error); }
});

app.get("/api/settings", async (_req, res) => {
  try { res.json(await getSettings()); }
  catch (error) { handleError(res, error); }
});

app.put("/api/settings", async (req, res) => {
  try {
    const goal = Number(req.body.daily_goal_ml);
    if (!Number.isInteger(goal) || goal < 250 || goal > 10000) {
      return res.status(400).json({ error: "Choose a daily goal between 250 and 10,000 ml." });
    }
    await pool.execute(
      "INSERT INTO user_settings (id, daily_goal_ml) VALUES (1, ?) ON DUPLICATE KEY UPDATE daily_goal_ml = VALUES(daily_goal_ml)",
      [goal]
    );
    // Apply the newly saved goal to today, while leaving previous dates unchanged.
    await pool.execute(
      "UPDATE daily_summaries SET goal_ml = ? WHERE summary_date = ?",
      [goal, todayString()]
    );
    res.json({ message: "Daily goal saved.", daily_goal_ml: goal });
  } catch (error) { handleError(res, error); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));

app.listen(PORT, () => {
  console.log(`AquaTrack is running at http://localhost:${PORT}`);
});
