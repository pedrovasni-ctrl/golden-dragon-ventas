const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { buscar } = req.query;
  let compradores;
  if (buscar) {
    compradores = db.query('SELECT * FROM compradores WHERE nombre LIKE ? ORDER BY id DESC', [`%${buscar}%`]);
  } else {
    compradores = db.query('SELECT * FROM compradores ORDER BY id DESC');
  }
  res.json(compradores);
});

router.get('/:id', (req, res) => {
  const comprador = db.get('SELECT * FROM compradores WHERE id = ?', [req.params.id]);
  if (!comprador) return res.status(404).json({ error: 'Comprador no encontrado' });
  res.json(comprador);
});

router.post('/', (req, res) => {
  const { nombre, email, telefono, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });
  db.run(
    'INSERT INTO compradores (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)',
    [nombre, email || '', telefono || '', direccion || '']
  );
  const rows = db.query('SELECT * FROM compradores ORDER BY id DESC LIMIT 1');
  res.status(201).json(rows[0]);
});

router.put('/:id', (req, res) => {
  const { nombre, email, telefono, direccion } = req.body;
  const existing = db.get('SELECT * FROM compradores WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Comprador no encontrado' });

  db.run(
    'UPDATE compradores SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?',
    [
      nombre ?? existing.nombre,
      email ?? existing.email,
      telefono ?? existing.telefono,
      direccion ?? existing.direccion,
      req.params.id
    ]
  );
  const comprador = db.get('SELECT * FROM compradores WHERE id = ?', [req.params.id]);
  res.json(comprador);
});

router.delete('/:id', (req, res) => {
  const existing = db.get('SELECT * FROM compradores WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Comprador no encontrado' });
  db.run('DELETE FROM compradores WHERE id = ?', [req.params.id]);
  res.json({ mensaje: 'Comprador eliminado' });
});

module.exports = router;
