
require("dotenv").config(); 
const fs = require("fs");
const { getDb, DB_FILE } = require("../lib/db");

const reset = process.argv.includes("--reset");

if (reset) {
  for (const file of [DB_FILE, `${DB_FILE}-journal`, `${DB_FILE}-wal`, `${DB_FILE}-shm`]) {
    if (fs.existsSync(file)) fs.rmSync(file);
  }
  console.log(`Removed ${DB_FILE}`);
}

try {
  const db = getDb();
  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  console.log(`Database ready: ${DB_FILE}`);
  console.log(`  menu items: ${count("menu_items")}, users: ${count("users")}, orders: ${count("orders")}`);
} catch (err) {
  console.error("Database initialization failed:", err.message);
  process.exit(1);
}
