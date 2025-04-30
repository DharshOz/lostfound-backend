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
 
 // Email Configuration - Using the working approach from your other project
 const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
         user: 'smartcityprojectdl@gmail.com', // Using the email that works in your other project
         pass: 'tbnrzmafuxxfnued' // Using the password that works in your other project
         //user: 'dharaneeshrajendran2004@gmail.com', // Using the email that works in your other project
         //pass: 'dyaznluepljrjrcq' // Using the password that works in your other project
     }
 });
 
 // Verify transporter on startup
 transporter.verify(function(error, success) {
     if (error) {
         console.log('❌ SMTP Connection Error:', error);
     } else {
         console.log('✅ SMTP Server is ready to take our messages');
     }
 });
 
 // Email Sending Endpoint - Simplified and robust
 app.post("/api/send-found-email", async (req, res) => {
     console.log('\n===== FOUND ITEM EMAIL REQUEST =====');
 
     try {
         const { lostPersonEmail, itemName, finderName, finderPhone, locationFound, dateFound, description } = req.body;
 
         if (!lostPersonEmail || !itemName) {
             console.error('Missing required fields');
             return res.status(400).json({ error: "Missing required fields" });
         }
 
         const mailOptions = {
             from: '"Lost & Found System" <smartcityprojectdl@gmail.com>',
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
             // Priority headers from your working project
             headers: {
                 'X-Priority': '1',
                 'Importance': 'high'
             }
         };
 
         console.log('Sending email to:', lostPersonEmail);
         const info = await transporter.sendMail(mailOptions);
 
         console.log('✅ Email sent successfully! Message ID:', info.messageId);
         res.status(200).json({ success: true, messageId: info.messageId });
 
     } catch (error) {
         console.error('❌ Email send error:', error);
         res.status(500).json({ 
             error: error.message,
             // Include solution hint from your working project
             solution: "Check Gmail credentials and ensure 'Less Secure Apps' is enabled"
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
 
 // Test Endpoint - Using the same pattern from your working project
// Update your lost items route to ensure email is always returned
// In your lostItem routes file (likely routes/lostItem.js):

// Add this to your GET /api/lostitems/:id route
router.get('/:id', async (req, res) => {
    try {
        const item = await LostItem.findById(req.params.id)
            .populate('user', 'username email phone') // Make sure to include email
            .exec();
        
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (!item.user || !item.user.email) {
            return res.status(200).json({
                ...item.toObject(),
                emailWarning: 'Owner email not available'
            });
        }

        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update the email sending endpoint to handle missing emails more gracefully
app.post("/api/send-found-email", async (req, res) => {
    console.log('\n===== FOUND ITEM EMAIL REQUEST =====');
    
    try {
        const { lostPersonEmail, itemName } = req.body;

        if (!lostPersonEmail) {
            return res.status(400).json({ 
                error: "Owner email not available",
                warning: "Could not notify owner by email"
            });
        }

        if (!itemName) {
            return res.status(400).json({ error: "Item name is required" });
        }

        // Rest of your email sending logic...
    } catch (error) {
        console.error('❌ Email send error:', error);
        res.status(500).json({ 
            error: error.message,
            warning: "Email notification failed"
        });
    }
});
 
 // Start Server
 const PORT = process.env.PORT || 5000;
 server.listen(PORT, () => {
     console.log(`🚀 Server running on port ${PORT}`);
     console.log('Test email endpoint: GET /api/test-email');
 });
