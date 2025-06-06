const express = require('express')
const cors=require('cors')
const mongoose=require('mongoose')
const User=require('./models/user')
const Product=require('./models/product')
const Seller=require('./models/seller')
const jwt=require('jsonwebtoken')
const multer=require('multer')
const path=require('path')
const fs = require('fs');
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
require('dotenv').config()
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

mongoose.connect(process.env.MONGO_URI)
const app=express()
app.use(cors())
app.use(express.json())
const bcrypt=require('bcryptjs')

app.use('/uploads', express.static('uploads'));

app.use('/api',userRoutes);
app.use('/api',sellerRoutes);
app.use('/api', productRoutes);


app.listen(1337,()=>{
    console.log('Server is running on 1337')
})



// let otpStore = {}; // Temporary store for OTPs (use a database in production)

// // Endpoint to generate and send OTP
// app.post('/api/send-otp', async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ status: 'error', error: 'Email is required' });
//     }

//     const otp = crypto.randomInt(100000, 999999);

//     otpStore[email] = {
//         otp,
//         expiresAt: Date.now() + 5 * 60 * 1000, 
//     };

//     // Send OTP via email
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: 'your mail', 
//             pass: 'password', 
//         },
//     });

//     const mailOptions = {
//         from: 'your mail',
//         to: email,
//         subject: 'Your OTP for Email Verification',
//         text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         res.json({ status: 'ok', message: 'OTP sent to your email' });
//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).json({ status: 'error', error: 'Failed to send OTP' });
//     }
// });

// // Endpoint to verify OTP
// app.post('/api/verify-otp', (req, res) => {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//         return res.status(400).json({ status: 'error', error: 'Email and OTP are required' });
//     }

//     const storedOtp = otpStore[email];

//     if (!storedOtp) {
//         return res.status(400).json({ status: 'error', error: 'OTP not found or expired' });
//     }

//     if (storedOtp.otp !== parseInt(otp)) {
//         return res.status(400).json({ status: 'error', error: 'Invalid OTP' });
//     }

//     if (Date.now() > storedOtp.expiresAt) {
//         delete otpStore[email]; // Remove expired OTP
//         return res.status(400).json({ status: 'error', error: 'OTP has expired' });
//     }

//     // OTP is valid
//     delete otpStore[email]; // Remove OTP after successful verification
//     res.json({ status: 'ok', message: 'Email verified successfully' });
// });










