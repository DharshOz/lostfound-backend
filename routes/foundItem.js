const express = require("express");
const router = express.Router();
const FoundItem = require("../models/FoundItem");

// ✅ Report a found item
router.post("/", async (req, res) => {
    try {
        const { lostPerson, foundPerson, locationsFound, dateFound, name, image, description } = req.body;

        if (!Array.isArray(locationsFound) || locationsFound.length === 0) {
            return res.status(400).json({ message: "Please provide at least one location." });
        }

        const foundItem = new FoundItem({ lostPerson, foundPerson, locationsFound, dateFound, name, image, description });
        await foundItem.save();
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

module.exports = router;
