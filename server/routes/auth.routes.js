const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google-signin', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing credential' });
    }

    // 1. Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture,
    } = payload;

    // 2. Find user by email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      // ❌ user must already exist
      return res.status(401).json({
        message: 'User not registered',
      });
    }

    const user = users[0];

    // 3. First-time Google login → update google_id & picture
    if (!user.google_id) {
      await db.query(
        `
        UPDATE users
        SET google_id = ?, picture = ?, last_login = NOW()
        WHERE id = ?
        `,
        [googleId, picture, user.id]
      );
    } else {
      // Normal login → just update last_login
      await db.query(
        `
        UPDATE users
        SET last_login = NOW()
        WHERE id = ?
        `,
        [user.id]
      );
    }

    // 4. Issue JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Return UPDATED user payload
    res.json({
      token,
      user: {
        id: user.id,
        name: name || user.name,
        email: user.email,
        role: user.role,
        picture: picture || user.picture,
      },
    });

  } catch (err) {
    console.error('Google Sign-in Error:', err);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

module.exports = router;
