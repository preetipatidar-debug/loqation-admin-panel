// server/googleService.js
const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const mybusiness = google.mybusinessbusinessinformation({
    version: 'v1',
    auth: oauth2Client
});

function parseTime(timeStr) {
    if (!timeStr || timeStr === 'Closed' || timeStr.length < 5) return null;
    const [start, end] = timeStr.split('-');
    if (!start || !end) return null;
    const [h1, m1] = start.split(':');
    const [h2, m2] = end.split(':');
    return {
        openTime: { hours: parseInt(h1), minutes: parseInt(m1) },
        closeTime: { hours: parseInt(h2), minutes: parseInt(m2) }
    };
}

function mapHours(loc) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const periods = [];

    days.forEach(day => {
        const key = `hours_${day.toLowerCase()}`;
        const timeStr = loc[key];
        const timeObj = parseTime(timeStr);
        
        if (timeObj) {
            periods.push({
                openDay: day.toUpperCase(),
                openTime: timeObj.openTime,
                closeDay: day.toUpperCase(),
                closeTime: timeObj.closeTime
            });
        }
    });

    return periods.length > 0 ? { periods } : null;
}

// MAIN SYNC FUNCTION
async function syncLocationToGoogle(locationData, dbConnection) {
    try {
        console.log(`\n[Google API] ------------------------------------------------`);
        console.log(`[Google API] Preparing to sync: ${locationData.location_name}`);

        // 1. Construct Payload
        const payload = {
            storeCode: locationData.internal_id,
            title: locationData.location_name,
            languageCode: "en-US",
            phoneNumbers: {
                primaryPhone: locationData.phone_number
            },
            categories: {
                primaryCategory: { name: locationData.primary_category_id }
            },
            storefrontAddress: {
                addressLines: [locationData.street_address],
                locality: locationData.city,
                administrativeArea: locationData.state,
                postalCode: locationData.postal_code,
                regionCode: locationData.country || "US"
                
            },
            websiteUri: locationData.website_url,
        };

        // 2. Attach Hours only if they exist (Don't send null)
        const hours = mapHours(locationData);
        if (hours) {
            payload.regularHours = hours;
        }

        // 3. DEBUG: Log the exact data we are sending
        console.log("[Google API] OUTGOING PAYLOAD:");
        console.log(JSON.stringify(payload, null, 2)); 

        const accountId = process.env.GOOGLE_ACCOUNT_ID; 

        let response;
        if (locationData.google_location_id) {
             // UPDATE
             console.log(`[Google API] Updating: ${locationData.google_location_id}`);
             response = await mybusiness.locations.patch({
                 name: locationData.google_location_id,
                 updateMask: 'storeCode,title,phoneNumbers,storefrontAddress,regularHours,websiteUri',
                 requestBody: payload
             });
        } else {
             // CREATE
             console.log(`[Google API] Creating new in: ${accountId}`);
             response = await mybusiness.accounts.locations.create({
                 parent: accountId,
                 requestId: `req-${Date.now()}`,
                 requestBody: payload
             });
        }

        const googleData = response.data;
        const googleId = googleData.name;

        console.log(`[Google API] ✅ SUCCESS! Google ID: ${googleId}`);
        console.log(`[Google API] ------------------------------------------------\n`);

        await dbConnection.execute(
            "UPDATE locations SET sync_status = 'SYNCED', google_place_id = ? WHERE id = ?",
            [googleId, locationData.id]
        );

    } catch (error) {
        console.error("❌ [Google API Error] FAILED.");
        
        // DUMP THE FULL ERROR JSON
        if (error.response && error.response.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }

        await dbConnection.execute(
            "UPDATE locations SET sync_status = 'FAILED' WHERE id = ?",
            [locationData.id]
        );
    }
}

module.exports = { syncLocationToGoogle };