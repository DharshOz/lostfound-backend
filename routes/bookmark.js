const express = require("express");
const router = express.Router();
const Bookmark = require("../models/Bookmark");
const LostItem = require("../models/LostItem");

// ✅ Bookmark an item
router.post("/", async (req, res) => {
    try {
        const { userId, lostItemId } = req.body;

        // Check if the item is already bookmarked
        const existingBookmark = await Bookmark.findOne({ user: userId, lostItem: lostItemId });
        if (existingBookmark) {
            return res.status(400).json({ message: "Item already bookmarked." });
        }

        // Create a new bookmark
        const bookmark = new Bookmark({ user: userId, lostItem: lostItemId });
        await bookmark.save();

        res.status(201).json({ message: "Item bookmarked successfully", bookmark });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Get all bookmarks for a user
router.get("/:userId", async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ user: req.params.userId }).populate("lostItem");
        res.json(bookmarks);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Remove a bookmark
router.delete("/:id", async (req, res) => {
    try {
        const deletedBookmark = await Bookmark.findByIdAndDelete(req.params.id);
        if (!deletedBookmark) {
            return res.status(404).json({ message: "Bookmark not found." });
        }
        res.json({ message: "Bookmark removed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;