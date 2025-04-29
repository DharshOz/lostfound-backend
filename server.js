const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const http = require("http");
const socketIo = require("socket.io");
const nodemailer = require("nodemailer");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO to work behind a reverse proxy (Render)
const io = socketIo(server, {
    cors: {
        origin: "*",
    },
    path: "/socket.io/",
});

// Middleware
app.use(cors());
app.use(express.json());

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
        folder: "lost-found-app",
        allowed_formats: ["jpg", "jpeg", "png"],
    },
});

const upload = multer({ storage });

// Create Nodemailer transporter with debug logging
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'smartcityprojectdl@gmail.com',
        pass: 'tbnrzmafuxxfnued'
    },
    logger: true, // Enable logging
    debug: true   // Enable debug output
});

// Verify transporter connection on startup
transporter.verify(function(error, success) {
    if (error) {
        console.log('SMTP Connection Error:', error);
    } else {
        console.log('SMTP Server is ready to take our messages');
    }
});

// Enhanced email sending route with detailed logging
app.post("/api/send-email", async (req, res) => {
    console.log('\n===== EMAIL SEND REQUEST RECEIVED =====');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { to, subject, text, html } = req.body;

        if (!to || !subject) {
            console.error('Validation Error: Missing required fields');
            return res.status(400).json({ 
                message: "Missing required fields (to, subject)", 
                received: { to, subject } 
            });
        }

        console.log('\nPreparing email with options:');
        const mailOptions = {
            from: 'smartcityprojectdl@gmail.com',
            to,
            subject,
            text: text || '(No plain text content provided)',
            html: html || '(No HTML content provided)'
        };
        console.log('Mail Options:', mailOptions);

        console.log('\nAttempting to send email...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('\nEmail sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        
        res.status(200).json({ 
            message: "Email sent successfully",
            messageId: info.messageId
        });
    } catch (error) {
        console.error('\nEMAIL SEND ERROR:', error);
        console.error('Error Stack:', error.stack);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        
        // Special handling for authentication errors
        if (error.code === 'EAUTH') {
            console.error('AUTHENTICATION FAILED: Check email credentials');
        }
        
        // Special handling for rate limit errors
        if (error.code === 'EENVELOPE') {
            console.error('RATE LIMIT EXCEEDED: Too many recipients');
        }

        res.status(500).json({ 
            message: "Failed to send email",
            error: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log('===== EMAIL REQUEST PROCESSING COMPLETE =====\n');
    }
});

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

    socket.on("joinRoom", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
