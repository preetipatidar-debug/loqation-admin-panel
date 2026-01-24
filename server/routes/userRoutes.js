const express = require('express');
const router = express.Router();
const db = require('../db'); 
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Get current profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const query = 'SELECT id, name, email, picture, role, created_at FROM users WHERE email = ?';
        
        // Use [rows] syntax for promise-based mysql2
        const [rows] = await db.query(query, [userEmail]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 2. Get all users
router.get('/', verifyToken, async (req, res) => {
    try {
        // Use the promise-based query
        const [rows] = await db.query('SELECT id, name, email, role,last_login FROM users ORDER BY created_at DESC');
        res.json({ success: true, users: rows });
    } catch (err) {
        console.error('Database Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// 3. Delete user
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;

        if (req.user.id == userId) {
            return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
        }

        const query = 'DELETE FROM users WHERE id = ?';
        await db.query(query, [userId]);

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;