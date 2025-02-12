const express = require("express");
const router = express.Router();
const LostItem = require("../models/LostItem");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Save files in the 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); // Unique filename
    }
});

const upload = multer({ storage });

// ✅ Create a new lost item
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { user, name, locations, description, category, dateLost } = req.body;

        // Ensure locations is an array
        const locationsArray = Array.isArray(locations) ? locations : [locations];

        if (!locationsArray || locationsArray.length === 0) {
            return res.status(400).json({ message: "Please provide at least one location." });
        }

        // Get the uploaded image path
        const image = req.file ? req.file.path : null;

        const lostItem = new LostItem({
            user,
            name,
            image,
            locations: locationsArray,
            description,
            category,
            dateLost
        });

        await lostItem.save();
        res.status(201).json({ message: "Lost item added successfully", lostItem });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Other routes remain unchanged...
module.exports = router;