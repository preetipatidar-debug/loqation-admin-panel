const express = require('express');
const router = express.Router();
const db = require('../db'); 
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.get('/profile', verifyToken, asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT id, name, email, picture, role, created_at FROM users WHERE email = ?', [req.user.email]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: rows[0] });
}));

router.get('/', verifyToken, asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT id, name, email, role, last_login FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: rows });
}));

router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
    if (req.user.id == req.params.id) return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
}));

module.exports = router;