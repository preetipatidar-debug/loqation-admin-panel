const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/stats', verifyToken, asyncHandler(async (req, res) => {
  const [
    [[{ totalTopLocations }]],
    [[{ totalMainLocations }]],
    [[{ totalSubLocations }]],
    [[{ totalGooglePlaces }]],
    [[{ totalUsers }]]
  ] = await Promise.all([
    db.query('SELECT COUNT(*) AS totalTopLocations FROM top_locations'),
    db.query('SELECT COUNT(*) AS totalMainLocations FROM main_locations'), // Added based on frontend state
    db.query('SELECT COUNT(*) AS totalSubLocations FROM sub_locations'),
    db.query('SELECT COUNT(*) AS totalGooglePlaces FROM google_places_full'),
    db.query('SELECT COUNT(*) AS totalUsers FROM users') // Added based on frontend state
  ]);

  res.json({ 
    totalTopLocations, 
    totalMainLocations, 
    totalSubLocations, 
    totalGooglePlaces, 
    totalUsers 
  });
}));

module.exports = router;