const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { buscar } = req.query;
  let productos;
  if (buscar) {
    productos = db.query('SELECT * FROM productos WHERE nombre LIKE ? ORDER BY id DESC', [`%${buscar}%`]);
  } else {
    productos = db.query('SELECT * FROM productos ORDER BY id DESC');
  }
  res.json(productos);
});

router.get('/:id', (req, res) => {
  const producto = db.get('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

router.post('/', (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  if (!nombre || precio == null) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }
  db.run(
    'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
    [nombre, descripcion || '', parseFloat(precio), parseInt(stock || 0)]
  );
  const rows = db.query('SELECT * FROM productos ORDER BY id DESC LIMIT 1');
  res.status(201).json(rows[0]);
});

router.put('/:id', (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  const existing = db.get('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  db.run(
    `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?,
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [
      nombre ?? existing.nombre,
      descripcion ?? existing.descripcion,
      precio != null ? parseFloat(precio) : existing.precio,
      stock != null ? parseInt(stock) : existing.stock,
      req.params.id
    ]
  );
  const producto = db.get('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  res.json(producto);
});

router.delete('/:id', (req, res) => {
  const existing = db.get('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
  db.run('DELETE FROM productos WHERE id = ?', [req.params.id]);
  res.json({ mensaje: 'Producto eliminado' });
});

module.exports = router;
