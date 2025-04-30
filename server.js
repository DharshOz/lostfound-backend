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

// Enhanced Email Configuration with detailed logging
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dharaneeshrajendran2004@gmail.com',
        pass: 'dyaznluepljrjrcq'
    },
    logger: true,
    debug: true,
    pool: true,
    maxConnections: 1,
    maxMessages: 10
});

// Verify transporter on startup with more detailed logging
transporter.verify(function(error, success) {
    console.log('\n===== SMTP CONNECTION VERIFICATION =====');
    if (error) {
        console.log('❌ SMTP Connection Error:', error);
        console.log('Error details:', {
            code: error.code,
            command: error.command,
            response: error.response
        });
        if (error.code === 'EAUTH') {
            console.error('⚠️ Critical: Verify your app password at https://myaccount.google.com/apppasswords');
            console.error('⚠️ Ensure "Less Secure Apps" is enabled at https://myaccount.google.com/lesssecureapps');
        }
    } else {
        console.log('✅ SMTP Server is ready to take our messages');
        console.log('SMTP configuration:', {
            host: transporter.options.host,
            port: transporter.options.port,
            secure: transporter.options.secure
        });
    }
    console.log('======================================\n');
});

// Enhanced Email Sending Endpoint with detailed logging
app.post("/api/send-found-email", async (req, res) => {
    console.log('\n===== FOUND ITEM EMAIL REQUEST RECEIVED =====');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request headers:', req.headers);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { lostPersonEmail, itemName, finderName, finderPhone, locationFound, dateFound, description } = req.body;

        if (!lostPersonEmail || !itemName) {
            console.error('❌ Missing required fields');
            console.error('Missing fields:', {
                lostPersonEmail: !lostPersonEmail ? 'MISSING' : 'PRESENT',
                itemName: !itemName ? 'MISSING' : 'PRESENT'
            });
            return res.status(400).json({ 
                error: "Missing required fields",
                details: {
                    received: req.body,
                    required: ['lostPersonEmail', 'itemName']
                }
            });
        }

        console.log('\nPreparing email with details:');
        console.log('Recipient:', lostPersonEmail);
        console.log('Item:', itemName);
        console.log('Finder:', finderName);
        console.log('Phone:', finderPhone);

        const mailOptions = {
            from: '"Lost & Found System" <dharaneeshrajendran2004@gmail.com>',
            to: lostPersonEmail,
            subject: `Your lost item "${itemName}" has been found!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Hello,</h2>
                    <p>We're happy to inform you that your lost item <strong>${itemName}</strong> has been found!</p>
                    
                    <h3 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px;">Finder's Details</h3>
                    <ul style="line-height: 1.6;">
                        <li><strong>Found by:</strong> ${finderName}</li>
                        <li><strong>Contact phone:</strong> ${finderPhone}</li>
                        <li><strong>Location found:</strong> ${locationFound}</li>
                        <li><strong>Date found:</strong> ${dateFound}</li>
                        <li><strong>Description:</strong> ${description}</li>
                    </ul>
                    
                    <p style="margin-top: 20px;">Please contact the finder to arrange for the return of your item.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d;">
                        <p>Best regards,<br>The Lost & Found Team</p>
                    </div>
                </div>
            `,
            headers: {
                'X-Priority': '1',
                'Importance': 'high'
            }
        };

        console.log('\nAttempting to send email with options:');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('\n✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Accepted recipients:', info.accepted);
        console.log('Rejected recipients:', info.rejected);
        console.log('Response:', info.response);
        
        res.status(200).json({ 
            success: true, 
            messageId: info.messageId,
            accepted: info.accepted,
            response: info.response
        });

    } catch (error) {
        console.error('\n❌ Email send error:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        res.status(500).json({ 
            error: error.message,
            code: error.code,
            solution: "Check Gmail credentials and ensure 'Less Secure Apps' is enabled",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log('\n===== EMAIL REQUEST PROCESS COMPLETED =====');
        console.log('Completed at:', new Date().toISOString());
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
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.log("❌ MongoDB Connection Error:", err));

// Socket.IO Connection
io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    socket.on("joinRoom", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Enhanced Test Endpoint
app.get('/api/test-email', async (req, res) => {
    console.log('\n===== TEST EMAIL REQUEST RECEIVED =====');
    try {
        const testMail = {
            to: 'dharaneeshrajendran2004@gmail.com',
            subject: 'TEST EMAIL from Lost & Found System',
            html: `<div>
                <h1>Lost & Found System Test</h1>
                <p>This email confirms your email settings are working correctly.</p>
                <p><strong>Server Time:</strong> ${new Date()}</p>
            </div>`,
            headers: {
                'X-Priority': '1'
            }
        };

        console.log('Sending test email to:', testMail.to);
        const info = await transporter.sendMail(testMail);
        
        console.log('Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        
        res.json({
            success: true,
            message: 'Test email sent successfully',
            messageId: info.messageId,
            response: info.response
        });
    } catch (error) {
        console.error('Test email failed:', error);
        res.status(500).json({
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log('===== TEST EMAIL PROCESS COMPLETED =====');
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log(`- POST /api/send-found-email`);
    console.log(`- GET /api/test-email`);
    console.log(`- Other existing API endpoints`);
});
