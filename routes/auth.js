const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Middleware to allow CORS for all routes in this file
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// ✅ Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, message: "Login successful" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// Signup route
router.post('/signup', async (req, res) => {
    const { username, email, phone, profession, location, password } = req.body;

    // Check for missing required fields
    if (!username || !email || !phone || !profession || !location || !location.state || !location.district || !password) {
        return res.status(400).json({
            error: 'Missing required fields',
            missingFields: {
                username: !username,
                email: !email,
                phone: !phone,
                profession: !profession,
                location: !location,
                locationState: !location?.state,
                locationDistrict: !location?.district,
                password: !password
            }
        });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new User({
        username,
        email,
        phone,
        profession,
        location,
        password: hashedPassword
    });

    try {
        // Save the user to the database
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error('Error saving user:', err);
        res.status(500).json({ error: 'Error saving user', details: err });
    }
});

module.exports = router;