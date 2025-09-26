require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'yourjwtsecret';

const cors = require('cors');
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Define Order Schema
const orderSchema = new mongoose.Schema({
    email: String,
    tableNumber: Number,
    paymentMethod: String,
    orderItems: Array,
    totalPrice: Number,
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Define Admin Schema
const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});
const Admin = mongoose.model('Admin', adminSchema);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Serve User and Admin pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "home.html")));
app.get('/index', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get("/admin-login", (req, res) => res.sendFile(path.join(__dirname, "public", "admin-login.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ success: false, message: "No token provided" });

    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        return res.status(401).json({ success: false, message: "Invalid token format" });
    }

    jwt.verify(tokenParts[1], JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ success: false, message: "Unauthorized" });
        req.adminId = decoded.id;
        next();
    });
};

// Save order details in MongoDB and send email
app.post('/send-order-details', async (req, res) => {
    const { email, tableNumber, paymentMethod, orderItems, totalPrice } = req.body;
    if (!email || !tableNumber || !paymentMethod) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    
    try {
        const newOrder = new Order({ email, tableNumber, paymentMethod, orderItems, totalPrice });
        await newOrder.save();

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL, pass: process.env.PASSWORD }
        });
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your Order Details',
            text: `Table Number: ${tableNumber}\nPayment Method: ${paymentMethod}\nOrder Items: ${orderItems.map(item => item.name).join(', ')}\nTotal Price: ₹${totalPrice}\nThank you for your order!`
        };
        await transporter.sendMail(mailOptions);

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ success: false, message: 'Error processing order.' });
    }
});

// ✅ Generate QR Code for UPI Payments (Reads from .env)
app.get('/generate-qr', async (req, res) => {
    const amount = req.query.amount;
    const upiId = process.env.UPI_ID; // Read from .env
    const upiName = process.env.UPI_NAME || "Merchant"; // Default name if not set

    if (!amount) {
        return res.status(400).json({ success: false, message: "Amount is required" });
    }

    if (!upiId) {
        return res.status(500).json({ success: false, message: "UPI ID not configured in .env" });
    }

    try {
        const upiPaymentString = `upi://pay?pa=${upiId}&pn=${upiName}&mc=&tid=&tr=&tn=OrderPayment&am=${amount}&cu=INR`;

        const qrCodeUrl = await QRCode.toDataURL(upiPaymentString);
        res.json({ success: true, qrCodeUrl });
    } catch (error) {
        console.error("Error generating QR code:", error);
        res.status(500).json({ success: false, message: "Error generating QR code" });
    }
});

// Admin login endpoint
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
});

// Get sales statistics
app.get('/admin/sales', verifyToken, async (req, res) => {
    try {
        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: { 
                        $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } 
                    },
                    totalSales: { $sum: "$totalPrice" },
                    totalOrders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, salesData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching sales data' });
    }
});

// Get all orders
app.get('/admin/orders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
