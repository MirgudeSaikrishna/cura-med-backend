const Seller = require('../models/seller');
const Product = require('../models/product');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.sellerRegister = async (req, res) => {
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
};

exports.sellerView = async (req, res) => {
    const token = req.headers['x-access-token'];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const seller = await Seller.findOne({ email });
        if (!seller) {
            return res.json({ status: 'error', error: 'Seller not found' });
        }
        const products = await Product.find({ seller: seller.shopName });
        return res.json({ status: 'ok', seller, products });
    } catch (error) {
        return res.json({ status: 'error', error: 'Invalid token' });
    }
};