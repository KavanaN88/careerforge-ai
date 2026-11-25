const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://skillpilot:skillpilot@localhost:5432/skillpilot",
});

// Create tables if missing. Retries so the API can start before PostgreSQL is ready (docker compose).
async function init(retries = 30) {
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
  for (let i = 1; ; i++) {
    try { await pool.query(sql); return; }
    catch (err) {
      if (i >= retries) throw err;
      console.log(`[db] waiting for PostgreSQL (${i}/${retries}): ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

module.exports = { pool, init };
