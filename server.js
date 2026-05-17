const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { initDatabase, run, get, query } = require('./database');

const productosRouter = require('./routes/productos');
const compradoresRouter = require('./routes/compradores');
const ventasRouter = require('./routes/ventas');
const inventarioRouter = require('./routes/inventario');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'golden-dragon-secret-key-2026';

const USERS = {
  'Golden2026': { password: 'Mocoso1801$$', role: 'admin', name: 'Administrador' },
  'usuario': { password: 'usuario2026', role: 'user', name: 'Usuario' }
};

app.use(cors());
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function authMiddleware(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'No autenticado' });
  res.redirect('/login.html');
}

function adminMiddleware(req, res, next) {
  if (req.session.role === 'admin') return next();
  res.status(403).json({ error: 'Solo administradores' });
}

app.use('/api/productos', authMiddleware, productosRouter);
app.use('/api/compradores', authMiddleware, adminMiddleware, compradoresRouter);
app.use('/api/ventas', authMiddleware, ventasRouter);
app.use('/api/inventario', authMiddleware, inventarioRouter);

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (user && user.password === password) {
    req.session.authenticated = true;
    req.session.username = username;
    req.session.role = user.role;
    req.session.userName = user.name;
    return res.json({ success: true, role: user.role, name: user.name });
  }
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  res.json({
    authenticated: !!(req.session && req.session.authenticated),
    role: req.session?.role || null,
    name: req.session?.userName || null
  });
});

app.get('/api/auth/permisos', (req, res) => {
  if (!req.session || !req.session.authenticated) return res.status(401).json({ error: 'No autenticado' });
  res.json({ role: req.session.role, name: req.session.userName });
});

app.get('/api/tasa', async (req, res) => {
  try {
    const row = await get("SELECT valor FROM config WHERE clave = 'tasa_bcv'");
    res.json({ tasa: row ? parseFloat(row.valor) : 0 });
  } catch (err) { res.json({ tasa: 0 }); }
});

app.post('/api/tasa', async (req, res) => {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  const { tasa } = req.body;
  await run("DELETE FROM config WHERE clave = 'tasa_bcv'");
  await run("INSERT INTO config (clave, valor) VALUES ('tasa_bcv', ?)", [String(tasa)]);
  res.json({ success: true, tasa });
});

app.post('/api/notificar', async (req, res) => {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  const { comprador, telefono, venta_id, total_usd, total_bs, items } = req.body;
  if (!telefono) return res.json({ enviado: false, motivo: 'Sin teléfono' });
  try {
    const mensaje = encodeURIComponent(
      `🧾 *GOLDEN DRAGON* - Factura #${venta_id}\n\n` +
      `Hola ${comprador}, gracias por tu compra.\n` +
      `Items: ${items}\n` +
      `Total: $${total_usd.toFixed(2)} / Bs. ${total_bs.toFixed(2)}\n\n` +
      `¡Vuelve pronto! 🐉`
    );
    await run("INSERT INTO notificaciones (venta_id, comprador, telefono, mensaje) VALUES (?, ?, ?, ?)",
      [venta_id, comprador, telefono, decodeURIComponent(mensaje)]);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(telefono)}&text=${mensaje}&apikey=`;
    fetch(url).catch(() => {});
    res.json({ enviado: true });
  } catch (err) { res.json({ enviado: false, error: err.message }); }
});

app.get('/notificaciones', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notificaciones.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => {
  if (!req.session || !req.session.authenticated) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GOLDEN DRAGON corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar:', err);
  process.exit(1);
});
