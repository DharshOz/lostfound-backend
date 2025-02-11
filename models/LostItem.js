const mongoose = require('mongoose');

const LostItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    image: { type: String }, // Store the image URL or file path
    location: { type: String, required: true },
    description: { type: String, required: true },
    dateLost: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LostItem', LostItemSchema);
ś