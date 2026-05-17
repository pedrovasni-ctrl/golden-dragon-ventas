const express = require('express');
const router = express.Router();
const db = require('../database');

const isPG = db.getDbType() === 'postgres';

router.get('/', (req, res) => {
  const { desde, hasta, estado, buscar } = req.query;
  let sql = `SELECT v.*, c.nombre AS comprador_nombre
             FROM ventas v JOIN compradores c ON v.comprador_id = c.id WHERE 1=1`;
  const params = [];
  if (desde) { sql += ' AND v.created_at >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND v.created_at <= ?'; params.push(hasta); }
  if (estado) { sql += ' AND v.estado = ?'; params.push(estado); }
  if (buscar) {
    const b = `%${buscar}%`;
    const idExpr = isPG ? 'v.id::text' : 'CAST(v.id AS TEXT)';
    sql += ` AND (${idExpr} LIKE ? OR c.nombre LIKE ?)`;
    params.push(b, b);
  }
  sql += ' ORDER BY v.id DESC';
  res.json(db.query(sql, params));
});

router.get('/resumen', async (req, res) => {
  try {
    const dateExpr = isPG ? "created_at::date = CURRENT_DATE" : "date(created_at) = date('now')";
    const dateGroup = isPG ? "created_at::date" : "date(created_at)";
    const [ventas_hoy, ventas_totales, productos_bajo_stock, productos_mas_vendidos, ventas_por_dia] = await Promise.all([
      db.get(`SELECT COUNT(*) as total, COALESCE(SUM(total),0) as monto FROM ventas WHERE ${dateExpr} AND estado != 'cancelada'`),
      db.get(`SELECT COUNT(*) as total, COALESCE(SUM(total),0) as monto FROM ventas WHERE estado != 'cancelada'`),
      db.get('SELECT COUNT(*) as total FROM productos WHERE stock <= 5'),
      db.query(`SELECT p.id, p.nombre, COALESCE(SUM(vi.cantidad),0) as cantidad, COALESCE(SUM(vi.subtotal),0) as total FROM ventas_items vi JOIN productos p ON vi.producto_id = p.id JOIN ventas v ON vi.venta_id = v.id WHERE v.estado != 'cancelada' GROUP BY p.id, p.nombre ORDER BY cantidad DESC LIMIT 5`),
      db.query(`SELECT ${dateGroup} as fecha, COUNT(*) as cantidad, COALESCE(SUM(total),0) as monto FROM ventas WHERE estado != 'cancelada' GROUP BY ${dateGroup} ORDER BY fecha DESC LIMIT 7`)
    ]);
    res.json({
      ventas_hoy: ventas_hoy || { total: 0, monto: 0 },
      ventas_totales: ventas_totales || { total: 0, monto: 0 },
      productos_bajo_stock: productos_bajo_stock || { total: 0 },
      productos_mas_vendidos: productos_mas_vendidos || [],
      ventas_por_dia: ventas_por_dia || []
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  const venta = db.get('SELECT v.*, c.nombre AS comprador_nombre FROM ventas v JOIN compradores c ON v.comprador_id = c.id WHERE v.id = ?', [req.params.id]);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  venta.items = db.query('SELECT vi.*, p.nombre AS producto_nombre FROM ventas_items vi JOIN productos p ON vi.producto_id = p.id WHERE vi.venta_id = ?', [req.params.id]);
  res.json(venta);
});

router.post('/', async (req, res) => {
  const { comprador_id, items } = req.body;
  if (!comprador_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Comprador y al menos un producto son requeridos' });
  }

  let total = 0;
  const itemsData = [];
  for (const item of items) {
    const producto = await db.get('SELECT * FROM productos WHERE id = ?', [item.producto_id]);
    if (!producto) return res.status(400).json({ error: `Producto ID ${item.producto_id} no encontrado` });
    if (producto.stock < item.cantidad) {
      return res.status(400).json({ error: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}` });
    }
    const subtotal = producto.precio * item.cantidad;
    total += subtotal;
    itemsData.push({ producto_id: item.producto_id, cantidad: item.cantidad, precio_unitario: producto.precio, subtotal });
  }

  try {
    let ventaId;
    if (isPG) {
      const result = await db.query(
        'INSERT INTO ventas (comprador_id, total) VALUES (?, ?) RETURNING id',
        [comprador_id, total]
      );
      ventaId = result[0].id;
    } else {
      ventaId = (await db.query('SELECT COALESCE(MAX(id),0)+1 as next_id FROM ventas'))[0].next_id;
      await db.run('INSERT INTO ventas (id, comprador_id, total) VALUES (?, ?, ?)', [ventaId, comprador_id, total]);
    }

    for (const item of itemsData) {
      await db.run('INSERT INTO ventas_items (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]);
      await db.run('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.producto_id]);
    }

    const venta = await db.get('SELECT v.*, c.nombre AS comprador_nombre FROM ventas v JOIN compradores c ON v.comprador_id = c.id WHERE v.id = ?', [ventaId]);
    venta.items = await db.query('SELECT vi.*, p.nombre AS producto_nombre FROM ventas_items vi JOIN productos p ON vi.producto_id = p.id WHERE vi.venta_id = ?', [ventaId]);
    res.status(201).json(venta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  if (!['pendiente', 'completada', 'cancelada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido. Use: pendiente, completada, cancelada' });
  }
  const venta = await db.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

  if (estado === 'cancelada' && venta.estado !== 'cancelada') {
    const items = await db.query('SELECT * FROM ventas_items WHERE venta_id = ?', [req.params.id]);
    for (const item of items) await db.run('UPDATE productos SET stock = stock + ? WHERE id = ?', [item.cantidad, item.producto_id]);
  }
  if (estado !== 'cancelada' && venta.estado === 'cancelada') {
    const items = await db.query('SELECT * FROM ventas_items WHERE venta_id = ?', [req.params.id]);
    for (const item of items) await db.run('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.producto_id]);
  }
  await db.run('UPDATE ventas SET estado = ? WHERE id = ?', [estado, req.params.id]);

  const updated = await db.get('SELECT v.*, c.nombre AS comprador_nombre FROM ventas v JOIN compradores c ON v.comprador_id = c.id WHERE v.id = ?', [req.params.id]);
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const venta = await db.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.estado !== 'cancelada') {
    const items = await db.query('SELECT * FROM ventas_items WHERE venta_id = ?', [req.params.id]);
    for (const item of items) await db.run('UPDATE productos SET stock = stock + ? WHERE id = ?', [item.cantidad, item.producto_id]);
  }
  await db.run('DELETE FROM ventas WHERE id = ?', [req.params.id]);
  res.json({ mensaje: 'Venta eliminada' });
});

module.exports = router;
