const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who bookmarked the item
    lostItem: { type: mongoose.Schema.Types.ObjectId, ref: 'LostItem', required: true } // Which item was bookmarked
}, { timestamps: true });

module.exports = mongoose.model('Bookmark', BookmarkSchema);
