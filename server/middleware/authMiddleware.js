const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'wowdash_secret_2026_fixed';
     if (!token) return res.status(401).json({ success: false, message: 'Access Denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Now contains id, email, role
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        res.status(403).json({ success: false, message: 'Invalid Token' });
    }
};

module.exports = { verifyToken };