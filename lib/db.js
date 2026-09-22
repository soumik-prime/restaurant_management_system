const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const SCHEMA_VERSION = 1;

const DB_FILE = path.resolve(
  process.cwd(),
  process.env.DB_FILE || path.join("data", "rms.db"),
);

function loadDriver() {
  const sqlite =
    typeof process.getBuiltinModule === "function"
      ? process.getBuiltinModule("node:sqlite")
      : undefined;

  if (!sqlite || !sqlite.DatabaseSync) {
    throw new Error(
      `This app stores its data with Node's built-in SQLite support, which needs ` +
        `Node.js 22.13 or newer (you are running ${process.version}). ` +
        `Install the current LTS version from https://nodejs.org and try again.`,
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
  return {
    insertId: Number(info.lastInsertRowid),
    affectedRows: Number(info.changes),
  };
}

function readSqlFile(name) {
  const file = path.join(process.cwd(), name);
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    throw new Error(
      `Could not read ${name} (looked in ${file}). Run the app from the project's root folder.`,
    );
  }
}

const DEMO_USERS = [
  {
    name: "System Admin",
    email: "admin@rms.local",
    password: "Admin123!",
    role: "admin",
  },
  {
    name: "Restaurant Manager",
    email: "manager@rms.local",
    password: "Manager123!",
    role: "manager",
  },
  {
    name: "Floor Staff",
    email: "staff@rms.local",
    password: "Staff123!",
    role: "staff",
  },
];

function ensureDemoUsers(db) {
  for (const user of DEMO_USERS) {
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(user.email);
    if (existing) continue;

    const hash = bcrypt.hashSync(user.password, 10);
    db.prepare(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)",
    ).run(user.name, user.email, hash, user.role);

    console.log(
      `[rms] Created demo ${user.role} account: ${user.email} / ${user.password}`,
    );
  }
}

const DEMO_ORDERS = [
  {
    table_number: "2",
    status: "CONFIRMED",
    payment_method: "ON_COMPLETION",
    payment_status: "UNPAID",
    cancel_reason: null,
    tracking_token: "demo-confirmed-token",
    items: [
      { name: "Chicken Biryani", quantity: 2 },
      { name: "Borhani", quantity: 2 },
    ],
  },
  {
    table_number: "7",
    status: "PREPARING",
    payment_method: "ONLINE",
    payment_status: "PAID",
    cancel_reason: null,
    tracking_token: "demo-preparing-token",
    items: [
      { name: "Beef Tehari", quantity: 1 },
      { name: "Fresh Lime Soda", quantity: 1 },
    ],
  },
  {
    table_number: "11",
    status: "READY",
    payment_method: "ONLINE",
    payment_status: "PAID",
    cancel_reason: null,
    tracking_token: "demo-ready-token",
    items: [
      { name: "Chicken Grill", quantity: 1 },
      { name: "Chocolate Lava Cake", quantity: 1 },
    ],
  },
  {
    table_number: "15",
    status: "SERVED",
    payment_method: "ON_COMPLETION",
    payment_status: "UNPAID",
    cancel_reason: null,
    tracking_token: "demo-served-token",
    items: [
      { name: "Vegetable Fried Rice", quantity: 1 },
      { name: "Spring Rolls", quantity: 2 },
    ],
  },
  {
    table_number: "5",
    status: "CANCELLED",
    payment_method: "ON_COMPLETION",
    payment_status: "UNPAID",
    cancel_reason: "Kitchen ran out of the selected item.",
    tracking_token: "demo-cancelled-token",
    items: [
      { name: "Mixed Vegetable Salad", quantity: 1 },
      { name: "Firni", quantity: 1 },
    ],
  },
];

function ensureDemoOrders(db) {
  if (db.prepare("SELECT COUNT(*) AS count FROM orders").get().count > 0) {
    return;
  }

  const menu = db
    .prepare("SELECT id, name, price FROM menu_items ORDER BY id")
    .all();
  const menuByName = new Map(menu.map((item) => [item.name, item]));

  for (const order of DEMO_ORDERS) {
    const orderInsert = db
      .prepare(
        "INSERT INTO orders (table_number, status, payment_method, payment_status, cancel_reason, tracking_token) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        order.table_number,
        order.status,
        order.payment_method,
        order.payment_status,
        order.cancel_reason,
        `${order.tracking_token}-${crypto.randomBytes(8).toString("hex")}`,
      );

    for (const line of order.items) {
      const item = menuByName.get(line.name);
      if (!item) continue;

      db.prepare(
        "INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)",
      ).run(
        orderInsert.lastInsertRowid,
        item.id,
        item.name,
        item.price,
        line.quantity,
      );
    }

    console.log(
      `[rms] Created demo order for table ${order.table_number} with status ${order.status}`,
    );
  }
}

function bootstrap(db) {
  const currentVersion = () =>
    db.prepare("PRAGMA user_version").get().user_version;
  if (currentVersion() >= SCHEMA_VERSION) {
    ensureDemoUsers(db);
    ensureDemoOrders(db);
    return;
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    if (currentVersion() < SCHEMA_VERSION) {
      db.exec(readSqlFile("schema.sql"));
      db.exec(readSqlFile("seed.sql"));
      ensureDemoUsers(db);
      ensureDemoOrders(db);
      db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      console.log(
        `[rms] New database created at ${DB_FILE} (starter menu loaded).`,
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {}
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
      throw new Error(
        "transaction() callbacks must be synchronous — remove the await/async.",
      );
    }
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw err;
  }
}

module.exports = { query, transaction, getDb, DB_FILE };
