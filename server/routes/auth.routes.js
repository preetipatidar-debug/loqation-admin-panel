const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'wowdash_secret_key_2026';

router.post('/google-signin', async (req, res) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [payload.email]
    );

    if (!rows.length) {
      return res.status(403).json({ success: false, message: 'Unauthorized user' });
    }

    const user = {
      id: rows[0].id,
      email: payload.email,
      name: payload.name,
      role: rows[0].role
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user });
  } catch {
    res.status(401).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;
