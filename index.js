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

mongoose.connect(process.env.MONGO_URI)
const app=express()
app.use(cors())
app.use(express.json())
const bcrypt=require('bcryptjs')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Make sure this folder exists
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

app.post('/api/register', async (req, res) => {
    const {name, email,password}=req.body.formdata;
    const hashPassword= await bcrypt.hash(password,10)
    const user= await User.findOne({email: email})
    if(user){
        return res.json({status:'error',error:'Email already in use'})
    }
    try{
        const user = await User.create({name, email, password:hashPassword});
        return res.json({ status: 'ok' });
    } catch (err) {
        return res.json({ status: 'error'});
    }
})

app.post('/api/sregister', async (req, res) => {
    const {shopName, email,password,phone,address,latitude,longitude}=req.body.formdata;
    const hashPassword= await bcrypt.hash(password,10)
    const seller= await Seller.findOne({email: email})
    if(seller){
        res.json({status:'error',error:'Email already in use'})
    }else{
        try{
            const seller = await Seller.create({shopName, email, password:hashPassword,phone,address,location: {type: 'Point',coordinates: [longitude, latitude]}});
            return res.json({ status: 'ok' });
        } catch (err) {
            return res.json({ status: 'error'});
        }
    }
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

app.post('/api/login', async (req, res) => {
    const  {usertype,email,password}=req.body;
    if(usertype==='user'){
        const user=await User.findOne({email:email})
        if (!user) {
            return res.json({ status: 'error', error: 'Invalid mail' });
        }
        else{
            const isMatch=await bcrypt.compare(password,user.password)
            if(!isMatch){
                return res.json({status:'error',error:'Invalid password'})
            }else{
                const token = jwt.sign({
                    email: user.email
                }, process.env.JWT_SECRET);
                return res.json({ status: 'ok', user: token ,type:usertype});
            }
        }
    }else{
        const user=await Seller.findOne({email:email})
        if (!user) {
            return res.json({ status: 'error', error: 'Invalid username/password' });
        }
        else{
            const isMatch=await bcrypt.compare(password,user.password)
            if(!isMatch){
                return res.json({status:'error',error:'Invalid username/password'})
            }else{
                const token = jwt.sign({
                    email: user.email
                }, process.env.JWT_SECRET);
                return res.json({ status: 'ok', user: token ,type:usertype});
            }
        }
    }
    
})

app.get('/api/U_view', async (req, res) => {
    try{
        const token = req.headers['x-access-token'];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const user = await User.findOne({ email });
        const sellers = await Seller.find();
        if (!sellers) {
            return res.json({ status: 'error', error: 'No sellers found' });
        }
        if(user) {
            res.json({ status: 'ok', sellers, type:'user' });
        }else{
            res.json({ status: 'ok', sellers, type:'seller' });
        }
    }catch(err){
        return res.json({ status: 'error', error: 'error fetching data' });
    }
})


app.get('/api/nearest', async (req, res) => {
    const { latitude, longitude, distance} = req.query; 

    if (!latitude || !longitude) {
        return res.status(400).json({ status: 'error', error: 'Latitude and longitude are required' });
    }

    try {
        const sellers = await Seller.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)], 
                    },
                    $maxDistance: distance*1000, 
                },
            },
        });

        return res.json({ status: 'ok', sellers });
    } catch (error) {
        console.error('Error finding nearest sellers:', error);
        return res.status(500).json({ status: 'error', error: 'Internal server error' });
    }
});

app.get('/api/products/:shopName', async (req,res)=>{
    const shopName=req.params.shopName;
    const products=await Product.find({seller:shopName});
    const location=await Seller.findOne({shopName:shopName}).select('location');
    if(products){
        return res.json({status:'ok',products,location})
    }
    else{
        return res.json({status:'error',error:'no products found'})
    }
})

const authMiddleware= async(req,res,next)=>{
    const token=req.headers['x-access-token']
    if(token){
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const email=decoded.email;
        const user=await Seller.findOne({email:email})
        if(user){
                next()
        }else{
            return res.json({status:'error',error:'Unauthorised'})
        }
    }
};
app.use(authMiddleware)

app.get('/api/S_view', async (req, res) => {
    const token = req.headers['x-access-token'];
    try {
        const decoded = jwt.verify(token,"SECRET1162");
        const email = decoded.email;
        const seller = await Seller.findOne({ email });
        const products = await Product.find({ seller: seller.shopName });
        if (!seller) {
            return res.json({ status: 'error', error: 'Seller not found' });
        }else{
            return res.json({status:'ok',seller,products});
        }
    } catch (error) {
        return res.json({ status: 'error', error: 'Invalid token' });
    }
})

app.post('/api/addproduct',upload.single('image'), async (req,res)=>{
    try{
        const {name,price,description,seller}=req.body
        const image = req.file ? `/uploads/${req.file.filename}` : '';
        const product=await Product.create({seller,name,price,description,image})
        return res.json({status:'ok'})
    }catch(err){
        return res.json({status:'error',error:'Error adding product'})
    }
});



app.post('/api/deleteProduct', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ status: 'error', error: 'Product ID is required' });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ status: 'error', error: 'Product not found' });
    }

    // Delete image file if it exists
    if (product.image) {
      const imagePath = path.join(__dirname, 'uploads', path.basename(product.image));

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Failed to delete image:', err);
        } else {
          console.log('Deleted image:', imagePath);
        }
      });
    }

    return res.json({ status: 'ok', message: 'Product and image deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ status: 'error', error: 'Error deleting product' });
  }
});


app.listen(1337,()=>{
    console.log('Server is running on 1337')
})
