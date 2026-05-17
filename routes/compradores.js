const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  const { buscar } = req.query;
  try {
    const compradores = buscar
      ? await db.query('SELECT * FROM compradores WHERE nombre LIKE ? ORDER BY id DESC', [`%${buscar}%`])
      : await db.query('SELECT * FROM compradores ORDER BY id DESC');
    res.json(compradores);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const comprador = await db.get('SELECT * FROM compradores WHERE id = ?', [req.params.id]);
    if (!comprador) return res.status(404).json({ error: 'Comprador no encontrado' });
    res.json(comprador);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { nombre, email, telefono, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });
  try {
    await db.run(
      'INSERT INTO compradores (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)',
      [nombre, email || '', telefono || '', direccion || '']
    );
    const rows = await db.query('SELECT * FROM compradores ORDER BY id DESC LIMIT 1');
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { nombre, email, telefono, direccion } = req.body;
  try {
    const existing = await db.get('SELECT * FROM compradores WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Comprador no encontrado' });

    await db.run(
      'UPDATE compradores SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?',
      [
        nombre ?? existing.nombre,
        email ?? existing.email,
        telefono ?? existing.telefono,
        direccion ?? existing.direccion,
        req.params.id
      ]
    );
    const comprador = await db.get('SELECT * FROM compradores WHERE id = ?', [req.params.id]);
    res.json(comprador);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM compradores WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Comprador no encontrado' });
    await db.run('DELETE FROM compradores WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Comprador eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
