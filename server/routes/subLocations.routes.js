const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const safe = (v) => (v === undefined || v === '' ? null : v);

router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { search = '', main_location_id, page = 1, limit = 25 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  if (main_location_id) {
    where += ' AND s.main_location_id = ?';
    params.push(main_location_id);
  }

  if (search) {
    where += ' AND (s.name LIKE ? OR s.type LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term);
  }

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM sub_locations s ${where}`,
    params
  );

  const [rows] = await db.query(
    `SELECT s.*, l.location_name AS parent_main_name
     FROM sub_locations s
     JOIN locations l ON s.main_location_id = l.id
     ${where}
     ORDER BY s.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total } });
}));

router.post('/', verifyToken, asyncHandler(async (req, res) => {
  await db.execute(
    'INSERT INTO sub_locations (main_location_id, name, type, description) VALUES (?, ?, ?, ?)',
    [safe(req.body.main_location_id), safe(req.body.name), safe(req.body.type), safe(req.body.description)]
  );
  res.json({ success: true });
}));

router.put('/:id', verifyToken, asyncHandler(async (req, res) => {
  await db.execute(
    'UPDATE sub_locations SET name=?, type=?, description=? WHERE id=?',
    [safe(req.body.name), safe(req.body.type), safe(req.body.description), req.params.id]
  );
  res.json({ success: true });
}));

router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
  await db.execute('DELETE FROM sub_locations WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

module.exports = router;