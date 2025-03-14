require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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
    date: { type: Date, default: () => new Date() } // Ensuring correct date format
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
app.use(express.static(path.join(__dirname, 'public'), { index: false })); // Disable automatic index.html serving

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Serve User and Admin pages
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/admin-login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Middleware to verify admin token for API routes
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

// Save order details to MongoDB and send email
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

// Function to create an admin with a hashed password
const createAdmin = async () => {
    const username = "admin";
    const plainPassword = "admin";
    
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
        console.log("Admin already exists!");
        return;
    }
    
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const newAdmin = new Admin({ username, password: hashedPassword });
    
    await newAdmin.save();
    console.log("Admin created successfully!");
};
// Uncomment and run once to create an admin user
//createAdmin();

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

// Get sales statistics (Protected API)
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
            { $sort: { _id: 1 } } // Ensure sales appear in chronological order
        ]);

        console.log("Sales Data:", salesData); // Debugging: Ensure today's sales appear
        res.json({ success: true, salesData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching sales data' });
    }
});

// Get all orders (Protected API)
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
