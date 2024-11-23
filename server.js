require('dotenv').config()
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path'); // Import path module

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file (index.html) at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Adjust the filename as necessary
});

// Endpoint to handle order details request
app.post('/send-order-details', (req, res) => {
    const { email, tableNumber, paymentMethod, orderItems, totalPrice } = req.body;

    // Validate inputs (basic validation)
    if (!email || !tableNumber || !paymentMethod) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email service provider
        auth: {
            user: 'process.env.EMAIL', // Your email address
            pass: 'process.env.PASSWORD' // Your email password or app password; consider using environment variables for security
        }
    });

    const mailOptions = {
        from: 'process.env.EMAIL',
        to: email,
        subject: 'Your Order Details',
        text: `Hello! Here are your order details:\n\n` +
              `Table Number: ${tableNumber}\n` +
              `Payment Method: ${paymentMethod}\n` +
              `Order Items: ${orderItems.map(item => item.name).join(', ')}\n` +
              `Total Price: ₹${totalPrice}\n` +
              `Thank you for your order!`
    };

    // Send email asynchronously
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ success: false, message: 'Error sending email.' });
        }
        
        // Send success response
        res.json({ success: true });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});