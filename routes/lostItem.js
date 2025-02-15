const express = require("express");
const router = express.Router();
const LostItem = require("../models/LostItem");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lost-found-app",
        allowed_formats: ["jpg", "jpeg", "png"],
    },
});

const upload = multer({ storage });

// ✅ **POST: Add a lost item**
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { user, name, locations, district, state, description, category, dateLost } = req.body;

        // Ensure locations is an array
        const locationsArray = Array.isArray(locations) ? locations : [locations];

        if (!locationsArray.length) {
            return res.status(400).json({ message: "Please provide at least one location." });
        }

        if (!district || !state) {
            return res.status(400).json({ message: "District and state are required." });
        }

        // Get the Cloudinary image URL
        const image = req.file ? req.file.path : null;

        const lostItem = new LostItem({
            user,
            name,
            image, 
            locations: locationsArray,
            district,
            state,
            description,
            category,
            dateLost
        });

        await lostItem.save();
        res.status(201).json({ message: "Lost item added successfully", lostItem });
    } catch (err) {
        console.error("Error adding lost item:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


// ✅ Fetch lost items reported by a specific user
router.get("/user/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const lostItems = await LostItem.find({ user: userId });
        res.status(200).json(lostItems);
    } catch (err) {
        console.error("Error fetching lost items by user:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});





// ✅ **GET: Fetch lost items by name, category, or district**
router.get("/", async (req, res) => {
    try {
        const { name, category, district } = req.query;

        let filter = {};

        if (name) {
            filter.name = { $regex: new RegExp(name, "i") }; // Case-insensitive search
        }
        if (category) {
            filter.category = { $regex: new RegExp(category, "i") };
        }
        if (district) {
            filter.district = { $regex: new RegExp(district, "i") };
        }

        // Find lost items that match the filters
        const lostItems = await LostItem.find(filter);

        res.status(200).json(lostItems);
    } catch (err) {
        console.error("Error fetching lost items:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


// ✅ **GET: Fetch a lost item by ID**
router.get("/:id", async (req, res) => {
    try {
        const lostItem = await LostItem.findById(req.params.id).populate("user", "username");

        if (!lostItem) {
            return res.status(404).json({ message: "Lost item not found." });
        }

        res.status(200).json(lostItem);
    } catch (err) {
        console.error("Error fetching lost item:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ **DELETE: Remove a lost item by ID**
router.delete("/:id", async (req, res) => {
    try {
        const lostItem = await LostItem.findByIdAndDelete(req.params.id);

        if (!lostItem) {
            return res.status(404).json({ message: "Lost item not found." });
        }

        res.status(200).json({ message: "Lost item deleted successfully." });
    } catch (err) {
        console.error("Error deleting lost item:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
