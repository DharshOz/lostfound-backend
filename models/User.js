const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    profession: { type: String, required: true },
    location: {
        district: { type: String, required: true },
        state: { type: String, required: true }
    },
    password: { type: String, required: true },
    notifications: [
        {
            message: { type: String, required: true },
            read: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
        },
    ],
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;