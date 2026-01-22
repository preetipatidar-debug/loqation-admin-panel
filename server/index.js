require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');
const { syncLocationToGoogle } = require('./googleService');
const { validateLocation } = require('./validator');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your_local_jwt_secret';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Access Denied: No Token Provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid or Expired Token" });
        }
        req.user = user;
        next();
    });
};

app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none"); // Ensure embedder policy doesn't conflict
    next();
  });

// --- SERVE STATIC FRONTEND ---
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

// --- HELPERS ---
const safe = (v) => (v === undefined || v === '') ? null : v;
const formatDate = (value) => {
    if (!value) return null;
    return String(value).split('T')[0];
};
// Simple Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: "Backend is working on 3001!" });
  });
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [areas] = await db.query("SELECT COUNT(*) as count FROM top_locations");
        const [businesses] = await db.query("SELECT COUNT(*) as count FROM locations");
        const [units] = await db.query("SELECT COUNT(*) as count FROM sub_locations");

        res.json({
            totalAreas: areas[0].count,
            totalBusinesses: businesses[0].count,
            totalUnits: units[0].count
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// server/index.js
app.get('/api/search/global', authenticateToken, async (req, res) => {
    const query = req.query.q;
    
    // Safety: If query is empty, return empty array immediately
    if (!query) return res.json([]);

    const term = `%${query}%`;
    try {
        const [areas] = await db.query("SELECT 'Area' as type, name as title, id FROM top_locations WHERE name LIKE ? LIMIT 3", [term]);
        const [biz] = await db.query("SELECT 'Business' as type, location_name as title, id FROM locations WHERE location_name LIKE ? OR city LIKE ? LIMIT 3", [term, term]);
        const [units] = await db.query("SELECT 'Unit' as type, name as title, id FROM sub_locations WHERE name LIKE ? LIMIT 3", [term]);
        
        // Combine results into a single flat array
        const results = [...areas, ...biz, ...units];
        res.json(results); 
    } catch (e) { 
        console.error("Global Search Error:", e.message);
        // Even on error, return an empty array to prevent frontend crash
        res.json([]); 
    }
});
// ==========================================
// 1. AUTH ROUTES
// ==========================================
app.post('/api/auth/google-signin', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.REACT_APP_GOOGLE_CLIENT_ID, 
        });
        const payload = ticket.getPayload();
        const user = {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            googleId: payload.sub
        };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, user });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ success: false, message: 'Invalid Google Token' });
    }
});

// ==========================================
// 2. TOP LOCATIONS (Areas)
// ==========================================
app.get('/api/top-locations', authenticateToken, async (req, res) => {
    try {
        const search = req.query.search || '';
        const params = [];
        let sql = "SELECT * FROM top_locations";
        if (search) {
            sql += " WHERE name LIKE ? OR description LIKE ?";
            const term = `%${search}%`;
            params.push(term, term);
        }
        sql += " ORDER BY id DESC";
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/top-locations', authenticateToken, async (req, res) => {
    const { name, description, geometrics_outline } = req.body;
    try {
        await db.execute(
            "INSERT INTO top_locations (name, description, geometrics_outline) VALUES (?, ?, ?)",
            [safe(name), safe(description), safe(geometrics_outline)]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/top-locations/:id', authenticateToken, async (req, res) => {
    const { name, description, geometrics_outline } = req.body;
    try {
        await db.execute(
            "UPDATE top_locations SET name=?, description=?, geometrics_outline=? WHERE id=?",
            [safe(name), safe(description), safe(geometrics_outline), req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/top-locations/:id', authenticateToken, async (req, res) => {
    try {
        await db.execute('DELETE FROM top_locations WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 3. MAIN LOCATIONS (Business Profiles)
// ==========================================
app.get('/api/main-locations', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const search = req.query.search || '';
        const parentId = req.query.parent_id || '';
        const sortBy = req.query.sortBy || 'id';
        const sortOrder = req.query.order === 'ASC' ? 'ASC' : 'DESC';
        const offset = (page - 1) * limit;

        const allowedSorts = ['id', 'internal_id', 'location_name', 'city', 'sync_status', 'parent_area_name'];
        let safeSortBy = 'l.id';
        if (allowedSorts.includes(sortBy)) {
            if (sortBy === 'parent_area_name') safeSortBy = 't.name';
            else safeSortBy = `l.${sortBy}`;
        }

        let baseQuery = `FROM locations l LEFT JOIN top_locations t ON l.top_location_id = t.id WHERE 1=1`;
        const queryParams = [];

        if (parentId) {
            baseQuery += ` AND l.top_location_id = ?`;
            queryParams.push(parentId);
        }
        if (search) {
            baseQuery += ` AND (l.location_name LIKE ? OR l.internal_id LIKE ? OR l.city LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [countRes] = await db.execute(`SELECT COUNT(*) as total ${baseQuery}`, queryParams);
        const total = countRes[0].total;

        const sql = `SELECT l.*, t.name as parent_area_name ${baseQuery} ORDER BY ${safeSortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;
        const [rows] = await db.query(sql, queryParams);

        res.json({ data: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/locations', authenticateToken, async (req, res) => {
    const data = req.body;
    if (data.primary_category_id && !data.primary_category_id.startsWith('gcid:')) {
        data.primary_category_id = 'gcid:' + data.primary_category_id;
    }
    const validationErrors = validateLocation(data);
    if (validationErrors.length > 0) return res.status(400).json({ error: "Validation Failed", details: validationErrors });

    try {
        const query = `INSERT INTO locations (top_location_id, internal_id, location_name, description, opening_date, primary_category_id, additional_category, lat, lng, street_address, house_number, postal_code, city, district, province, region, state, country, building_levels, main_entrance_level, phone_country_code, phone_number, email, website_url, youtube_link, twitter_link, facebook_link, instagram_link, linkedin_link, tiktok_link, whatsapp_chat, text_message_chat, hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday, hours_saturday, hours_sunday, attributes, google_link, google_place_id, referring_top_location, media_floorplan, media_photos, media_videos, media_logos, geometrics_outline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [safe(data.parent_id), safe(data.internal_id), safe(data.location_name), safe(data.description), formatDate(data.opening_date), safe(data.primary_category_id), safe(data.additional_category), safe(data.lat), safe(data.lng), safe(data.street_address), safe(data.house_number), safe(data.postal_code), safe(data.city), safe(data.district), safe(data.province), safe(data.region), safe(data.state), safe(data.country), safe(data.building_levels), safe(data.main_entrance_level), safe(data.phone_country_code), safe(data.phone_number), safe(data.email), safe(data.website_url), safe(data.youtube_link), safe(data.twitter_link), safe(data.facebook_link), safe(data.instagram_link), safe(data.linkedin_link), safe(data.tiktok_link), safe(data.whatsapp_chat), safe(data.text_message_chat), safe(data.hours_monday), safe(data.hours_tuesday), safe(data.hours_wednesday), safe(data.hours_thursday), safe(data.hours_friday), safe(data.hours_saturday), safe(data.hours_sunday), JSON.stringify(data.attributes || {}), safe(data.google_link), safe(data.google_place_id), safe(data.referring_top_location), safe(data.media_floorplan), safe(data.media_photos), safe(data.media_videos), safe(data.media_logos), safe(data.geometrics_outline)];
        const [result] = await db.execute(query, values);
        const [newRows] = await db.query("SELECT * FROM locations WHERE id = ?", [result.insertId]);
        syncLocationToGoogle(newRows[0], db);
        res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/locations/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    try {
        const query = `UPDATE locations SET top_location_id=?, internal_id=?, location_name=?, description=?, opening_date=?, primary_category_id=?, additional_category=?, lat=?, lng=?, street_address=?, house_number=?, postal_code=?, city=?, district=?, province=?, region=?, state=?, country=?, building_levels=?, main_entrance_level=?, phone_country_code=?, phone_number=?, email=?, website_url=?, youtube_link=?, twitter_link=?, facebook_link=?, instagram_link=?, linkedin_link=?, tiktok_link=?, whatsapp_chat=?, text_message_chat=?, hours_monday=?, hours_tuesday=?, hours_wednesday=?, hours_thursday=?, hours_friday=?, hours_saturday=?, hours_sunday=?, attributes=?, google_link=?, google_place_id=?, referring_top_location=?, media_floorplan=?, media_photos=?, media_videos=?, media_logos=?, geometrics_outline=? WHERE id=?`;
        const values = [safe(data.parent_id), safe(data.internal_id), safe(data.location_name), safe(data.description), formatDate(data.opening_date), safe(data.primary_category_id), safe(data.additional_category), safe(data.lat), safe(data.lng), safe(data.street_address), safe(data.house_number), safe(data.postal_code), safe(data.city), safe(data.district), safe(data.province), safe(data.region), safe(data.state), safe(data.country), safe(data.building_levels), safe(data.main_entrance_level), safe(data.phone_country_code), safe(data.phone_number), safe(data.email), safe(data.website_url), safe(data.youtube_link), safe(data.twitter_link), safe(data.facebook_link), safe(data.instagram_link), safe(data.linkedin_link), safe(data.tiktok_link), safe(data.whatsapp_chat), safe(data.text_message_chat), safe(data.hours_monday), safe(data.hours_tuesday), safe(data.hours_wednesday), safe(data.hours_thursday), safe(data.hours_friday), safe(data.hours_saturday), safe(data.hours_sunday), JSON.stringify(data.attributes || {}), safe(data.google_link), safe(data.google_place_id), safe(data.referring_top_location), safe(data.media_floorplan), safe(data.media_photos), safe(data.media_videos), safe(data.media_logos), safe(data.geometrics_outline), id];
        await db.execute(query, values);
        const [updatedRows] = await db.query("SELECT * FROM locations WHERE id = ?", [id]);
        syncLocationToGoogle(updatedRows[0], db);
        res.json({ success: true, id: id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 4. SUB LOCATIONS (ATMs/Depts)
// ==========================================
app.get('/api/sub-locations', authenticateToken, async (req, res) => {
    try {
        const search = req.query.search || '';
        const params = [];
        let sql = `SELECT s.*, l.location_name as parent_main_name FROM sub_locations s JOIN locations l ON s.main_location_id = l.id`;
        if (search) {
            sql += " WHERE s.name LIKE ? OR s.type LIKE ? OR l.location_name LIKE ?";
            const term = `%${search}%`;
            params.push(term, term, term);
        }
        sql += " ORDER BY s.id DESC";
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sub-locations', authenticateToken, async (req, res) => {
    const body = req.body;
    const items = Array.isArray(body) ? body : [body];
    if (items.length === 0) return res.json({ success: true });
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const item of items) {
            await connection.execute(
                "INSERT INTO sub_locations (main_location_id, name, type, description) VALUES (?, ?, ?, ?)",
                [safe(item.parent_id), safe(item.name), safe(item.type), safe(item.description)]
            );
        }
        await connection.commit();
        res.json({ success: true, count: items.length });
    } catch (e) { 
        await connection.rollback();
        res.status(500).json({ error: e.message }); 
    } finally { connection.release(); }
});

// ==========================================
// 5. BULK DISCOVERY & DELETE
// ==========================================
app.post('/api/bulk-delete', authenticateToken, async (req, res) => {
    const { ids, type } = req.body;
    let table = '';
    if (type === 'TOP') table = 'top_locations';
    else if (type === 'SUB') table = 'sub_locations';
    else if (type === 'MAIN') table = 'locations';
    else return res.status(400).json({ error: "Invalid type" });

    try {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute(`DELETE FROM ${table} WHERE id IN (${placeholders})`, ids);
        res.json({ success: true, count: ids.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/main-locations/bulk', authenticateToken, async (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: "Invalid data" });
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const loc of items) {
            const internalId = loc.internal_id || `DISC-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            await connection.execute(
                `INSERT INTO locations (top_location_id, internal_id, location_name, street_address, city, lat, lng, google_place_id, ownership, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
                [safe(loc.top_location_id), safe(internalId), safe(loc.location_name), safe(loc.vicinity), safe(loc.city), safe(loc.lat), safe(loc.lng), safe(loc.place_id), safe(loc.ownership || 'CLIENT')]
            );
        }
        await connection.commit();
        res.json({ success: true, count: items.length });
    } catch (e) {
        await connection.rollback();
        res.status(500).json({ error: e.message });
    } finally { connection.release(); }
});

// ==========================================
// 6. OPTIONS & UTILS
// ==========================================
app.get('/api/options/top-locations', authenticateToken, async (req, res) => {
    const [rows] = await db.query("SELECT id, name FROM top_locations ORDER BY name ASC");
    res.json(rows);
});

app.get('/api/options/main-locations', authenticateToken, async (req, res) => {
    const sql = `SELECT l.id, l.location_name as name, l.lat, l.lng, t.geometrics_outline FROM locations l LEFT JOIN top_locations t ON l.top_location_id = t.id ORDER BY l.location_name ASC`;
    const [rows] = await db.query(sql);
    res.json(rows);
});

app.get('/api/options/google-types', async (req, res) => {
    try {
        const sql = "SELECT type_key, label, category_group FROM google_place_types ORDER BY category_group ASC, label ASC";
        const [rows] = await db.query(sql);
        if (rows.length === 0) {
            return res.json([
                { type_key: 'atm', label: 'ATM', category_group: 'Service' },
                { type_key: 'restaurant', label: 'Restaurant', category_group: 'Food' }
            ]);
        }
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => {
    res.status(200).send("LoQation API is Running. Access via Port 3000 Dashboard.");
});

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, '../build')));

// Route all non-API requests to React's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const PORT = process.env.SERVER_PORT || 3001; 
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));