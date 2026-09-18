
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");


const SCHEMA_VERSION = 1;

const DB_FILE = path.resolve(process.cwd(), process.env.DB_FILE || path.join("data", "rms.db"));


function loadDriver() {

  const sqlite =
    typeof process.getBuiltinModule === "function"
      ? process.getBuiltinModule("node:sqlite")
      : undefined;

  if (!sqlite || !sqlite.DatabaseSync) {
    throw new Error(
      `This app stores its data with Node's built-in SQLite support, which needs ` +
        `Node.js 22.13 or newer (you are running ${process.version}). ` +
        `Install the current LTS version from https://nodejs.org and try again.`
    );
  }
  return sqlite.DatabaseSync;
}

function bindable(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  return value;
}

const RETURNS_ROWS = /^\s*(?:--[^\n]*\n\s*)*(select|with|pragma|explain)\b/i;

function execute(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const args = params.map(bindable);

  if (RETURNS_ROWS.test(sql)) {
   
    return stmt.all(...args).map((row) => ({ ...row }));
  }
  const info = stmt.run(...args);
  return { insertId: Number(info.lastInsertRowid), affectedRows: Number(info.changes) };
}


function readSqlFile(name) {
  const file = path.join(process.cwd(), name);
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    throw new Error(
      `Could not read ${name} (looked in ${file}). Run the app from the project's root folder.`
    );
  }
}

function createFirstAdmin(db) {
  const email = (process.env.ADMIN_EMAIL || "admin@rms.local").trim();
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(
    "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'admin', 1)"
  ).run("System Admin", email, hash);

  console.log(`[rms] Created admin account: ${email} / ${password}`);
  console.log("[rms] Sign in at /login, then consider changing this password from the Admin dashboard.");
}

function bootstrap(db) {
  const currentVersion = () => db.prepare("PRAGMA user_version").get().user_version;
  if (currentVersion() >= SCHEMA_VERSION) return;


  db.exec("BEGIN IMMEDIATE");
  try {
    if (currentVersion() < SCHEMA_VERSION) {
      db.exec(readSqlFile("schema.sql"));
      db.exec(readSqlFile("seed.sql"));
      createFirstAdmin(db);
      db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      console.log(`[rms] New database created at ${DB_FILE} (starter menu loaded).`);
    }
    db.exec("COMMIT");
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      
    }
    throw err;
  }
}


function getDb() {
  if (global._rmsSqlite) return global._rmsSqlite;

  const DatabaseSync = loadDriver();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

  const db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  bootstrap(db);

  global._rmsSqlite = db;
  return db;
}


async function query(sql, params = []) {
  return execute(getDb(), sql, params);
}


function transaction(callback) {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = callback((sql, params) => execute(db, sql, params));
    if (result && typeof result.then === "function") {
      throw new Error("transaction() callbacks must be synchronous — remove the await/async.");
    }
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      
    }
    throw err;
  }
}

module.exports = { query, transaction, getDb, DB_FILE };
