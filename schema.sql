-- Restaurant Management System — SQLite schema
--
-- You never have to run this by hand. lib/db.js applies it automatically the
-- first time the app touches the database (it creates data/rms.db, applies
-- this file, loads seed.sql and creates the first Admin account).
--
-- Notes on the SQLite flavour:
--   * ENUM columns are TEXT + CHECK constraints.
--   * TINYINT(1) flags are plain INTEGER 0/1.
--   * Timestamps are stored as UTC ISO-8601 text (e.g. 2026-09-21T10:15:30.000Z),
--     which JavaScript's `new Date(...)` parses correctly.
--   * SQLite has no "ON UPDATE CURRENT_TIMESTAMP", so small triggers keep
--     updated_at fresh instead.

-- ---------------------------------------------------------------------------
-- users: Admin, Manager, Staff accounts (Customers do not need an account —
-- FR-03 identifies them by table number instead)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('admin','manager','staff')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------------
-- menu_items: FR-01, FR-10
-- image_url, is_veg and is_featured are small additions beyond the spec —
-- a photo per dish, a veg/non-veg indicator, and an optional "Popular" tag.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  price        REAL    NOT NULL,
  category     TEXT    NOT NULL,
  image_url    TEXT,
  is_veg       INTEGER NOT NULL DEFAULT 1,
  is_featured  INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------------
-- orders: FR-02..FR-09, order status lifecycle (section 3.6)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  table_number    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','CONFIRMED','PREPARING','READY','SERVED','CANCELLED')),
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('ONLINE','ON_COMPLETION')),
  payment_status  TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID','PAID')),
  cancel_reason   TEXT,
  tracking_token  TEXT NOT NULL UNIQUE,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_table  ON orders (table_number);

-- ---------------------------------------------------------------------------
-- order_items: line items of an order, price captured at order time so later
-- menu price changes never rewrite history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name     TEXT    NOT NULL,
  unit_price    REAL    NOT NULL,
  quantity      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers (replacement for MySQL's ON UPDATE CURRENT_TIMESTAMP)
-- The WHEN clause stops a trigger from re-firing itself.
-- ---------------------------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_menu_items_updated_at
AFTER UPDATE ON menu_items
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE menu_items SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_updated_at
AFTER UPDATE ON orders
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE orders SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;
