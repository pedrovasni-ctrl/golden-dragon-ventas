const path = require('path');
const fs = require('fs');

let db = null;
let isPostgres = false;

const DB_PATH = path.join(__dirname, 'ventas.db');
const DATABASE_URL = process.env.DATABASE_URL || '';

async function initDatabase() {
  if (DATABASE_URL) {
    const { Pool } = require('pg');
    let url = DATABASE_URL;
    if (url.includes('supabase.co') && url.includes(':6543')) {
      const region = 'us-east-2';
      url = url.replace(/db\.[^.]+\.supabase\.co/, `aws-0-${region}.pooler.supabase.com`);
      url = url.replace(':6543', ':5432');
      url += '?pgbouncer=true';
    }
    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    db = pool;
    isPostgres = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY, nombre TEXT NOT NULL,
        descripcion TEXT DEFAULT '', precio REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS compradores (
        id SERIAL PRIMARY KEY, nombre TEXT NOT NULL,
        email TEXT DEFAULT '', telefono TEXT DEFAULT '',
        direccion TEXT DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY, comprador_id INTEGER NOT NULL,
        total REAL NOT NULL DEFAULT 0,
        estado TEXT NOT NULL DEFAULT 'completada',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comprador_id) REFERENCES compradores(id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ventas_items (
        id SERIAL PRIMARY KEY, venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL, cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL, subtotal REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);
    client.release();
    return db;
  }

  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
  db.run(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '', precio REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS compradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL,
    email TEXT DEFAULT '', telefono TEXT DEFAULT '',
    direccion TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, comprador_id INTEGER NOT NULL,
    total REAL NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'completada',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comprador_id) REFERENCES compradores(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ventas_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL, cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL, subtotal REAL NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  )`);
  save();
  return db;
}

function save() {
  if (!isPostgres && db && db.export) {
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  }
}

async function query(sql, params = []) {
  if (isPostgres) {
    let idx = 0;
    sql = sql.replace(/\?/g, () => `$${++idx}`);
    const result = await db.query(sql, params);
    return result.rows;
  }
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function run(sql, params = []) {
  if (isPostgres) {
    let idx = 0;
    sql = sql.replace(/\?/g, () => `$${++idx}`);
    await db.query(sql, params);
    return;
  }
  db.run(sql, params);
  save();
}

async function exec(sql) {
  if (isPostgres) {
    await db.query(sql);
    return;
  }
  db.run(sql);
  save();
}

function getDbType() { return isPostgres ? 'postgres' : 'sqlite'; }

module.exports = { initDatabase, query, get, run, exec, getDbType };
