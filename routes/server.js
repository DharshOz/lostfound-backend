const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO to work behind a reverse proxy (Render)
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins (update this in production)
    },
    path: "/socket.io/", // Ensure this matches the path in the frontend
});

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lost-found-app", // Folder in Cloudinary
        allowed_formats: ["jpg", "jpeg", "png"], // Allowed file formats
    },
});

const upload = multer({ storage });

// Routes
const authRoutes = require("./routes/auth");
const lostItemRoutes = require("./routes/lostItem");
const bookmarkRoutes = require("./routes/bookmark");
const foundItemRoutes = require("./routes/foundItem");

// Use API Routes
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/lostitems", lostItemRoutes);
app.use("/api/founditems", foundItemRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log("MongoDB Connection Error:", err));

// Socket.IO Connection
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a room based on user ID
    socket.on("joinRoom", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));