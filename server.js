const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { initDatabase } = require('./database');

const productosRouter = require('./routes/productos');
const compradoresRouter = require('./routes/compradores');
const ventasRouter = require('./routes/ventas');
const inventarioRouter = require('./routes/inventario');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'golden-dragon-secret-key-2026';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'golden2026';
const DATABASE_URL = process.env.DATABASE_URL || '';

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

app.use('/api/productos', authMiddleware, productosRouter);
app.use('/api/compradores', authMiddleware, compradoresRouter);
app.use('/api/ventas', authMiddleware, ventasRouter);
app.use('/api/inventario', authMiddleware, inventarioRouter);

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.authenticated = true;
    req.session.username = username;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
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
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Accesible desde la red en http://<tu-ip>:${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
