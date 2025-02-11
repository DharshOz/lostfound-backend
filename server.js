const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// Enable CORS to allow frontend & Cordova requests
app.use(cors({
    origin: ["http://localhost:5000", "http://192.168.143.175:5000", "file://"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Routes
app.use("/api", authRoutes);  // Now matches frontend requests

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
