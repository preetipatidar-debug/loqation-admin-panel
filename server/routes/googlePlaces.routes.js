const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  const { search = '', page = 1, limit = 25 } = req.query;
  const offset = (page - 1) * limit;

  let where = '';
  const params = [];

  if (search) {
    where = 'WHERE display_name_text LIKE ? OR formatted_address LIKE ?';
    const term = `%${search}%`;
    params.push(term, term);
  }

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM google_places_full ${where}`,
    params
  );

  const [rows] = await db.query(
    `SELECT * FROM google_places_full
     ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total } });
});

module.exports = router;
