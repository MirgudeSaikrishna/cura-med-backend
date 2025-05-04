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
    const sellers = await Seller.find();
    if (!sellers) {
        return res.json({ status: 'error', error: 'No sellers found' });
    }
    return res.json({status:'ok',sellers});
})

app.get('/api/nearest', async (req, res) => {
    const { latitude, longitude, distance} = req.query; // Get latitude and longitude from query parameters

    if (!latitude || !longitude) {
        return res.status(400).json({ status: 'error', error: 'Latitude and longitude are required' });
    }

    try {
        const sellers = await Seller.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)], // [longitude, latitude]
                    },
                    $maxDistance: distance*1000, // Maximum distance in meters (e.g., 5000 meters = 5 km)
                },
            },
        });

        if (sellers.length === 0) {
            return res.json({ status: 'ok', message: 'No sellers found nearby' });
        }

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
