const express = require("express");
const router = express.Router();
const LostItem = require("../models/LostItem");

// ✅ Create a new lost item
router.post("/", async (req, res) => {
    try {
        const { user, name, image, locations, description, category, dateLost } = req.body;
        
        if (!Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({ message: "Please provide at least one location." });
        }

        const lostItem = new LostItem({ user, name, image, locations, description, category, dateLost });
        await lostItem.save();
        res.status(201).json({ message: "Lost item added successfully", lostItem });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Get all lost items
router.get("/", async (req, res) => {
    try {
        const lostItems = await LostItem.find().populate("user", "username email");
        res.json(lostItems);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Get a specific lost item by ID
router.get("/:id", async (req, res) => {
    try {
        const lostItem = await LostItem.findById(req.params.id).populate("user", "username email");
        if (!lostItem) return res.status(404).json({ message: "Lost item not found" });

        res.json(lostItem);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Update a lost item
router.put("/:id", async (req, res) => {
    try {
        const updatedLostItem = await LostItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedLostItem) return res.status(404).json({ message: "Lost item not found" });

        res.json({ message: "Lost item updated successfully", updatedLostItem });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Delete a lost item
router.delete("/:id", async (req, res) => {
    try {
        const deletedLostItem = await LostItem.findByIdAndDelete(req.params.id);
        if (!deletedLostItem) return res.status(404).json({ message: "Lost item not found" });

        res.json({ message: "Lost item deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
