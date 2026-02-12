const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateLocation } = require('../validator');
const { syncLocationToGoogle } = require('../googleService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const safe = (v) => (v === undefined || v === '' ? null : v);

router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { search = '', top_location_id, page = 1, limit = 25 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  if (top_location_id) {
    where += ' AND l.top_location_id = ?';
    params.push(top_location_id);
  }

  if (search) {
    where += ' AND (l.location_name LIKE ? OR l.city LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term);
  }

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM locations l ${where}`, params);

  const [rows] = await db.query(
    `SELECT l.*, t.name AS top_location_name
     FROM locations l
     LEFT JOIN top_locations t ON l.top_location_id = t.id
     ${where}
     ORDER BY l.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total } });
}));

router.post('/', verifyToken, asyncHandler(async (req, res) => {
  const errors = validateLocation(req.body);
  if (errors.length) return res.status(400).json({ error: errors });

  const [result] = await db.execute(
    'INSERT INTO locations (top_location_id, location_name, city, lat, lng, geometrics_outline) VALUES (?, ?, ?, ?, ?, ?)',
    [
      safe(req.body.top_location_id),
      safe(req.body.location_name),
      safe(req.body.city),
      safe(req.body.lat),
      safe(req.body.lng),
      safe(req.body.geometrics_outline)
    ]
  );

  const [[row]] = await db.query('SELECT * FROM locations WHERE id = ?', [result.insertId]);
  syncLocationToGoogle(row, db);

  res.json({ success: true, id: result.insertId });
}));

// ... simplified remaining methods
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const [[row]] = await db.query('SELECT * FROM locations WHERE id = ?', [req.params.id]);
  res.json(row || null);
}));

router.put('/:id', verifyToken, asyncHandler(async (req, res) => {
  await db.execute(
    'UPDATE locations SET location_name=?, city=?, lat=?, lng=?, geometrics_outline=? WHERE id=?',
    [safe(req.body.location_name), safe(req.body.city), safe(req.body.lat), safe(req.body.lng), safe(req.body.geometrics_outline), req.params.id]
  );
  res.json({ success: true });
}));

router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
  await db.execute('DELETE FROM locations WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

module.exports = router;