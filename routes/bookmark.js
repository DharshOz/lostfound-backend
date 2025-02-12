const express = require("express");
const router = express.Router();
const Bookmark = require("../models/Bookmark");

// ✅ Add a bookmark
router.post("/", async (req, res) => {
    try {
        const { user, lostItem } = req.body;

        const existingBookmark = await Bookmark.findOne({ user, lostItem });
        if (existingBookmark) return res.status(400).json({ message: "Item already bookmarked" });

        const bookmark = new Bookmark({ user, lostItem });
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
        if (!deletedBookmark) return res.status(404).json({ message: "Bookmark not found" });

        res.json({ message: "Bookmark removed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
