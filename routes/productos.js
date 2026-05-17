const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  const { buscar } = req.query;
  try {
    const productos = buscar
      ? await db.query('SELECT * FROM productos WHERE nombre LIKE ? ORDER BY id DESC', [`%${buscar}%`])
      : await db.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(productos);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const producto = await db.get('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  if (!nombre || precio == null) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }
  try {
    await db.run(
      'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
      [nombre, descripcion || '', parseFloat(precio), parseInt(stock || 0)]
    );
    const rows = await db.query('SELECT * FROM productos ORDER BY id DESC LIMIT 1');
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  try {
    const existing = await db.get('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

    await db.run(
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
    const producto = await db.get('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    res.json(producto);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
    await db.run('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
