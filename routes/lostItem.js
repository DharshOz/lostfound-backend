const express = require("express");
const router = express.Router();
const LostItem = require("../models/LostItem");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lost-found-app", // Folder in Cloudinary
        allowed_formats: ["jpg", "jpeg", "png"], // Allowed file formats
    },
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

        // Get the Cloudinary image URL
        const image = req.file ? req.file.path : null;

        const lostItem = new LostItem({
            user,
            name,
            image, // Store the Cloudinary URL
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