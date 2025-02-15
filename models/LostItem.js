const mongoose = require('mongoose');

const LostItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    image: { type: String }, // Store the image URL or file path
    locations: [{ type: String, required: true }], // Allow multiple locations
    district: { type: String, required: true }, // Added district field
    state: { type: String, required: true }, // Added state field
    description: { type: String, required: true },
    category: { type: String, required: true }, // New field for categorizing lost items
    dateLost: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LostItem', LostItemSchema);
