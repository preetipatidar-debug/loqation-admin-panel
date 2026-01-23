const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all authorized users
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, email, picture, role, last_login FROM users ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Authorize a new email (Pre-registration)
router.post('/', async (req, res) => {
    const { name, email, role } = req.body;
    try {
        // google_id is omitted here; it stays NULL until their first login
        await db.execute(
            'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
            [name, email, role || 'editor']
        );
        res.json({ success: true, message: "User authorized" });
    } catch (err) {
        res.status(500).json({ error: "User already exists or database error" });
    }
});

// Revoke Access
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: "Access revoked" });
    } catch (err) {
        res.status(500).json({ error: "Deletion failed" });
    }
});

module.exports = router;