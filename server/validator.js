// server/validator.js

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

// Common ISO Country Codes
const VALID_COUNTRIES = new Set([
    'US', 'GB', 'CA', 'AU', 'IN', 'DE', 'FR', 'IT', 'ES', 'BR', 'JP', 'MX', 'NL'
]);

const validateLocation = (data) => {
    const errors = [];

    // --- 1. REQUIRED FIELDS CHECKS ---
    
    if (!data.internal_id || String(data.internal_id).trim() === '') {
        errors.push("Store Code (Internal ID) is required.");
    }
    
    if (!data.location_name || String(data.location_name).trim() === '') {
        errors.push("Business Name is required.");
    }

    if (!data.street_address || String(data.street_address).trim() === '') {
        errors.push("Street Address is required.");
    }

    if (!data.city || String(data.city).trim() === '') {
        errors.push("City is required.");
    }

    if (!data.postal_code || String(data.postal_code).trim() === '') {
        errors.push("Postal Code is required.");
    }
    
    if (!data.state || String(data.state).trim() === '') {
        errors.push("State/Province is required.");
    }

    if (!data.country || String(data.country).trim() === '') {
        errors.push("Country Code is required.");
    }

    // --- 2. FORMAT CHECKS ---

    // Category (Must be present and formatted)
    // Note: index.js adds 'gcid:' automatically, so we just check existence here
    if (!data.primary_category_id) {
        errors.push("Primary Category is required.");
    }

    // Phone Number (Optional, but if present must be valid)
    if (data.phone_number) {
        const cleanPhone = data.phone_number.replace(/[\s-]/g, '');
        if (!E164_REGEX.test(cleanPhone)) {
            errors.push(`Phone "${data.phone_number}" is invalid. Must be E.164 format (e.g., +14155550123).`);
        }
    }

    // Country Code Format
    if (data.country) {
        const country = data.country.toUpperCase();
        if (country.length !== 2) {
            errors.push(`Country "${country}" must be a 2-letter ISO code (e.g., US, IN).`);
        }
    }

    return errors;
};

module.exports = { validateLocation };