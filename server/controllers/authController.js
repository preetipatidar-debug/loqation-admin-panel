const { OAuth2Client } = require('google-auth-library');
const db = require('../db'); 
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, name, picture, sub: googleId } = ticket.getPayload();

        // CHECK WHITELIST
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "User is not registered. Please contact the administrator for access." 
            });
        }

        const user = rows[0];

        // UPDATE GOOGLE INFO ON FIRST/SUBSEQUENT LOGIN
        await db.execute(
            'UPDATE users SET google_id = ?, picture = ?, last_login = NOW() WHERE id = ?',
            [googleId, picture, user.id]
        );

        res.status(200).json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, picture }
        });

    } catch (error) {
        res.status(401).json({ success: false, message: "Invalid Google Account" });
    }
};