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

// Configure Socket.IO
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

// Email Configuration with your new app password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dharaneeshrajendran2004@gmail.com',
        pass: 'dyaznluepljrjrcq' // Your new app password here
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 10,
    logger: true,
    debug: true
});

// Verify transporter on startup
transporter.verify(function(error, success) {
    if (error) {
        console.log('SMTP Connection Error:', error);
        if (error.code === 'EAUTH') {
            console.error('⚠️ Critical: Verify your app password at https://myaccount.google.com/apppasswords');
        }
    } else {
        console.log('SMTP Server is ready to take our messages');
    }
});

// Email Queue System
const emailQueue = [];
let isSending = false;

async function processQueue() {
    if (isSending || emailQueue.length === 0) return;
    
    isSending = true;
    const { mailOptions, resolve, reject } = emailQueue.shift();
    
    try {
        console.log('Processing email to:', mailOptions.to);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully! Message ID:', info.messageId);
        resolve(info);
    } catch (error) {
        console.error('Email send error:', error);
        reject(error);
    } finally {
        isSending = false;
        processQueue();
    }
}

// Email Sending Endpoint
app.post("/api/send-email", async (req, res) => {
    console.log('\n===== EMAIL REQUEST RECEIVED =====');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
        console.error('Validation Error: Missing required fields');
        return res.status(400).json({ 
            error: "Missing required fields (to, subject)"
        });
    }

    const mailOptions = {
        from: 'smartcityprojectdl@gmail.com',
        to,
        subject,
        text: text || '(No text content provided)',
        html: html || '(No HTML content provided)'
    };

    return new Promise((resolve, reject) => {
        emailQueue.push({
            mailOptions,
            resolve,
            reject
        });
        processQueue();
    }).then(info => {
        res.status(200).json({ 
            success: true, 
            messageId: info.messageId 
        });
    }).catch(error => {
        let statusCode = 500;
        let errorResponse = { error: error.message };
        
        if (error.code === 'EAUTH') {
            statusCode = 401;
            errorResponse.solution = "Check Gmail credentials and app password settings";
        } else if (error.code === 'EENVELOPE') {
            statusCode = 400;
            errorResponse.rejected = error.rejected;
        }
        
        res.status(statusCode).json(errorResponse);
    });
});

// Test Endpoint
app.get('/api/test-email', async (req, res) => {
    try {
        const testMail = {
            to: 'smartcityprojectdl@gmail.com',
            subject: 'Test Email from Lost & Found Server',
            text: 'This is a test email from your Lost & Found server',
            html: '<b>This is a test email from your Lost & Found server</b>'
        };

        console.log('Sending test email...');
        const info = await transporter.sendMail(testMail);
        
        res.json({
            success: true,
            message: 'Test email sent successfully',
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Test email failed:', error);
        res.status(500).json({
            error: 'Failed to send test email',
            details: error.message
        });
    }
});

// Routes
const authRoutes = require("./routes/auth");
const lostItemRoutes = require("./routes/lostItem");
const bookmarkRoutes = require("./routes/bookmark");
const foundItemRoutes = require("./routes/foundItem");

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
