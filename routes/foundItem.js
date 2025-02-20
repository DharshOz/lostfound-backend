const express = require("express");
const router = express.Router();
const FoundItem = require("../models/FoundItem");
const User = require("../models/User");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "found-items", // Folder in Cloudinary
        allowed_formats: ["jpg", "jpeg", "png"], // Allowed file formats
    },
});

const upload = multer({ storage });

// ✅ Report a found item
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { lostPerson, foundPerson, foundPersonPhone, locationFound, dateFound, name, description } = req.body;
        const image = req.file ? req.file.path : null;

        // Create the found item
        const foundItem = new FoundItem({
            lostPerson,
            foundPerson,
            foundPersonPhone,
            locationFound,
            dateFound,
            name,
            image,
            description,
        });

        await foundItem.save();

        // Add a notification to the lost person
        const lostUser = await User.findById(lostPerson);
        if (lostUser) {
            const notification = {
                message: `Your lost item "${name}" has been reported as found by ${foundPerson.username}.`,
            };
            lostUser.notifications.push(notification);
            await lostUser.save();

            // Emit a real-time notification to the lost person
            req.app.get("io").to(lostPerson).emit("notification", notification);
        }

        res.status(201).json({ message: "Found item reported successfully", foundItem });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Get all found items
router.get("/", async (req, res) => {
    try {
        const foundItems = await FoundItem.find()
            .populate("lostPerson", "username email")
            .populate("foundPerson", "username email");
        res.json(foundItems);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Get a specific found item by ID
router.get("/:id", async (req, res) => {
    try {
        const foundItem = await FoundItem.findById(req.params.id)
            .populate("lostPerson", "username email")
            .populate("foundPerson", "username email");
        if (!foundItem) return res.status(404).json({ message: "Found item not found" });

        res.json(foundItem);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Fetch found items (replies) for a specific lost item
router.get("/lostItem/:lostItemId", async (req, res) => {
    try {
        const lostItemId = req.params.lostItemId;
        const foundItems = await FoundItem.find({ lostPerson: lostItemId })
            .populate("foundPerson", "username email");
        res.status(200).json(foundItems);
    } catch (err) {
        console.error("Error fetching found items by lost item:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Update a found item
router.put("/:id", async (req, res) => {
    try {
        const updatedFoundItem = await FoundItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedFoundItem) return res.status(404).json({ message: "Found item not found" });

        res.json({ message: "Found item updated successfully", updatedFoundItem });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Delete a found item
router.delete("/:id", async (req, res) => {
    try {
        const deletedFoundItem = await FoundItem.findByIdAndDelete(req.params.id);
        if (!deletedFoundItem) return res.status(404).json({ message: "Found item not found" });

        res.json({ message: "Found item deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Mark an item as found or not found
router.put("/:id/found", async (req, res) => {
    try {
        const { found } = req.body;
        const updatedFoundItem = await FoundItem.findByIdAndUpdate(
            req.params.id,
            { found },
            { new: true }
        );

        if (!updatedFoundItem) {
            return res.status(404).json({ message: "Found item not found" });
        }

        res.json({ message: "Found status updated successfully", updatedFoundItem });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;