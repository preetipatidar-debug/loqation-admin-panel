const express = require('express');
const cors = require('cors');
const path = require('path');
const { verifyToken } = require('./middleware/authMiddleware');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://app-dot-loqation-experience-demo.nw.r.appspot.com'],
  credentials: true
}));

/* ================= ROUTES ================= */
app.use('/api/auth', require('./routes/auth.routes'));

app.use('/api/users', verifyToken, require('./routes/userRoutes'));
app.use('/api/top-locations', verifyToken, require('./routes/topLocations.routes'));
app.use('/api/main-locations', verifyToken, require('./routes/mainLocations.routes'));
app.use('/api/sub-locations', verifyToken, require('./routes/subLocations.routes'));
app.use('/api/google-places', verifyToken, require('./routes/googlePlaces.routes'));

const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

app.get('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
