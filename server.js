const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const productosRouter = require('./routes/productos');
const compradoresRouter = require('./routes/compradores');
const ventasRouter = require('./routes/ventas');
const inventarioRouter = require('./routes/inventario');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/productos', productosRouter);
app.use('/api/compradores', compradoresRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/inventario', inventarioRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Accesible desde la red en http://<tu-ip>:${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
