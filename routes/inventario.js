const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/cargar', (req, res) => {
  const { items, mode } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de items' });
  }
  const results = { creados: 0, actualizados: 0, errores: [] };
  for (const item of items) {
    try {
      if (!item.nombre) {
        results.errores.push({ item, error: 'Nombre requerido' });
        continue;
      }
      const existing = db.get('SELECT * FROM productos WHERE nombre = ?', [item.nombre.trim()]);
      if (existing) {
        const nuevoStock = mode === 'replace'
          ? parseInt(item.stock || 0)
          : existing.stock + parseInt(item.stock || 0);
        db.run(
          'UPDATE productos SET stock = ?, precio = ?, descripcion = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [
            nuevoStock,
            item.precio != null ? parseFloat(item.precio) : existing.precio,
            item.descripcion ?? existing.descripcion,
            existing.id
          ]
        );
        results.actualizados++;
      } else {
        db.run(
          'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
          [
            item.nombre.trim(),
            item.descripcion || '',
            parseFloat(item.precio || 0),
            parseInt(item.stock || 0)
          ]
        );
        results.creados++;
      }
    } catch (err) {
      results.errores.push({ item, error: err.message });
    }
  }
  res.json(results);
});

router.get('/stock', (req, res) => {
  const { minimo, buscar } = req.query;
  let sql = 'SELECT * FROM productos WHERE 1=1';
  const params = [];
  if (minimo != null) {
    sql += ' AND stock <= ?';
    params.push(parseInt(minimo));
  }
  if (buscar) {
    sql += ' AND nombre LIKE ?';
    params.push(`%${buscar}%`);
  }
  sql += ' ORDER BY stock ASC, nombre ASC';
  res.json(db.query(sql, params));
});

module.exports = router;
