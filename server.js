const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const lostItemRoutes = require("./routes/lostItem"); // ✅ Import Lost Item Routes

dotenv.config();

const app = express();

// ✅ Move CORS middleware before routes
app.use(cors());

// ✅ Middleware for JSON parsing
app.use(express.json());

// ✅ Use API Routes
app.use("/api/auth", authRoutes);
app.use("/api/lostitems", lostItemRoutes); // ✅ Add Lost Item Routes

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log("MongoDB Connection Error:", err));

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
