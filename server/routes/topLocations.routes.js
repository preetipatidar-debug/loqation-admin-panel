const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const safe = (v) => (v === undefined || v === '' ? null : v);

router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 25 } = req.query;
  const offset = (page - 1) * limit;

  let where = '';
  const params = [];

  if (search) {
    where = 'WHERE name LIKE ? OR description LIKE ?';
    const term = `%${search}%`;
    params.push(term, term);
  }

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM top_locations ${where}`,
    params
  );

  const [rows] = await db.query(
    `SELECT * FROM top_locations ${where}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total } });
}));

router.post('/', verifyToken, asyncHandler(async (req, res) => {
  const { name, description, geometrics_outline } = req.body;
  await db.execute(
    'INSERT INTO top_locations (name, description, geometrics_outline) VALUES (?, ?, ?)',
    [safe(name), safe(description), safe(geometrics_outline)]
  );
  res.json({ success: true });
}));

router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const [[row]] = await db.query(
    'SELECT * FROM top_locations WHERE id = ?',
    [req.params.id]
  );
  res.json(row || null);
}));

router.put('/:id', verifyToken, asyncHandler(async (req, res) => {
  const { name, description, geometrics_outline } = req.body;
  await db.execute(
    'UPDATE top_locations SET name=?, description=?, geometrics_outline=? WHERE id=?',
    [safe(name), safe(description), safe(geometrics_outline), req.params.id]
  );
  res.json({ success: true });
}));

router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
  await db.execute('DELETE FROM top_locations WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

module.exports = router;