const express = require('express');
const cors = require('cors');
const path = require('path');
const { verifyToken } = require('./middleware/authMiddleware');

// 1. Environment Config
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://app-dot-loqation-experience-demo.nw.r.appspot.com'],
  credentials: true
}));

/* ================= ROUTES ================= */

// Public/Auth Routes
app.use('/api/auth', require('./routes/auth.routes'));

// Protected API Routes
// We apply verifyToken here once so you don't have to repeat it inside every individual route file
app.use('/api/users', verifyToken, require('./routes/userRoutes'));
app.use('/api/top-locations', verifyToken, require('./routes/topLocations.routes'));
app.use('/api/main-locations', verifyToken, require('./routes/mainLocations.routes'));
app.use('/api/sub-locations', verifyToken, require('./routes/subLocations.routes'));
app.use('/api/google-places', verifyToken, require('./routes/googlePlaces.routes'));
app.use('/api/dashboard', verifyToken, require('./routes/dashboard.routes'));

/* ================= STATIC FILES ================= */
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

/* ================= ERROR HANDLING ================= */

// A. API 404 Handler: Specifically for any /api/ calls that don't match above
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// B. Global Error Handler: The "Safety Net"
// Any error thrown in an asyncHandler will land here automatically
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// C. React SPA Catch-all: Must be the VERY LAST route
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});