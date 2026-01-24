require('dotenv').config();

console.log("--- Environment Check ---");
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("JWT_SECRET value:", process.env.JWT_SECRET || "NOT FOUND - using fallback");
console.log("-------------------------");

if (!process.env.JWT_SECRET) {
    console.log("FIX: Ensure your .env file is in the root of the /server folder.");
}