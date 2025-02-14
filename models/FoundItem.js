const mongoose = require('mongoose');

const FoundItemSchema = new mongoose.Schema({
    lostPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    foundPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    foundPersonPhone: { type: String, required: true }, // New field for found person's phone number
    locationFound: { type: String, required: true },
    dateFound: { type: Date, required: true },
    name: { type: String, required: true },
    image: { type: String }, // Store the image URL or file path
    description: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('FoundItem', FoundItemSchema);