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

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = socketIo(server, {
    cors: {
        origin: "*",
    },
    path: "/socket.io/",
});

// Middleware
app.use(cors());
app.use(express.json());

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lost-found-app",
        allowed_formats: ["jpg", "jpeg", "png"],
    },
});

const upload = multer({ storage });

// Nodemailer setup with Gmail App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'smartcityprojectdl@gmail.com',
        pass: 'tbnrzmafuxxfnued'
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    logger: true,
    debug: true
});

transporter.verify((error, success) => {
    if (error) {
        console.log('❌ SMTP Connection Error:', error);
    } else {
        console.log('✅ SMTP Server is ready');
    }
});

// ROUTE: Send email when item is found
app.post("/api/send-found-email", async (req, res) => {
    console.log('\n📬 Sending Found Item Email...');
    try {
        const {
            lostPersonEmail,
            itemName,
            finderName,
            finderPhone,
            locationFound,
            dateFound,
            description
        } = req.body;

        if (!lostPersonEmail || !itemName) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const mailOptions = {
            from: '"Lost & Found System" <smartcityprojectdl@gmail.com>',
            to: lostPersonEmail,
            subject: `Your item "${itemName}" has been found!`,
            text: `
Hello,

Your lost item "${itemName}" has been found!

Finder's Details:
- Name: ${finderName}
- Phone: ${finderPhone}
- Location: ${locationFound}
- Date Found: ${dateFound}
- Description: ${description}

Please contact the finder to retrieve your item.

- Lost & Found Team
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!', info.messageId);
        res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('❌ Email send error:', error);
        res.status(500).json({
            error: error.message,
            solution: "Check Gmail app password and recipient email address"
        });
    }
});

// ROUTE: Test email
app.get('/api/test-email', async (req, res) => {
    const testRecipient = process.env.TEST_EMAIL || 'yourpersonalemail@gmail.com'; // Change if needed
    try {
        const mailOptions = {
            from: '"Lost & Found System" <smartcityprojectdl@gmail.com>',
            to: testRecipient,
            subject: 'Plain Text Test - Lost & Found System',
            text: `
This is a plain text test email to confirm email functionality.

Server Time: ${new Date()}
Sender: smartcityprojectdl@gmail.com
Recipient: ${testRecipient}

If you're reading this, it worked! 🎉
            `
        };

        const info = await transporter.sendMail(mailOptions);
        res.json({
            success: true,
            message: 'Test email sent successfully',
            messageId: info.messageId
        });
    } catch (error) {
        console.error('❌ Test email failed:', error);
        res.status(500).json({
            error: 'Failed to send test email',
            details: error.message
        });
    }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// API Routes
const authRoutes = require("./routes/auth");
const lostItemRoutes = require("./routes/lostItem");
const bookmarkRoutes = require("./routes/bookmark");
const foundItemRoutes = require("./routes/foundItem");

app.use("/api/auth", authRoutes);
app.use("/api/lostitems", lostItemRoutes);
app.use("/api/founditems", foundItemRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

// Socket.IO connection handler
io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);

    socket.on("joinRoom", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`✅ Test endpoint available at /api/test-email`);
});
