const express = require('express')
const cors=require('cors')
const mongoose=require('mongoose')
const User=require('./models/user')
const Product=require('./models/product')
const Seller=require('./models/seller')
const jwt=require('jsonwebtoken')
mongoose.connect('mongodb://127.0.0.1:27017/myDatabaseName')
const app=express()
app.use(cors())
app.use(express.json())
const bcrypt=require('bcrypt')

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
    const {shopName, email,password,phone,address}=req.body.formdata;
    const hashPassword= await bcrypt.hash(password,10)
    const seller= await Seller.findOne({email: email})
    if(seller){
        res.json({status:'error',error:'Email already in use'})
    }else{
        try{
            const seller = await Seller.create({shopName, email, password:hashPassword,phone,address});
            return res.json({ status: 'ok' });
        } catch (err) {
            return res.json({ status: 'error'});
        }
    }
})

app.post('/api/login', async (req, res) => {
    const  {usertype,email,password}=req.body;
    if(usertype==='User'){
        const user=await User.findOne({email:email})
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
                }, 'secret_key');
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
                }, 'secret_key');
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

app.get('/api/products', async (req,res)=>{
    const products=await Product.find({seller:req.headers['shop-name']})
    if(products){
        return res.json({status:'ok',products})
    }
    else{
        return res.json({status:'error',error:'no products found'})
    }
})

const authMiddleware= async(req,res,next)=>{
    const token=req.headers['x-access-token']
    if(token){
        const decoded=jwt.verify(token,'secret_key');
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
        const decoded = jwt.verify(token,'secret_key');
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

app.post('/api/addproduct', async (req,res)=>{
    try{
        const {name,price,description,seller}=req.body
        const product=await Product.create({seller,name,price,description})
        return res.json({status:'ok'})
    }catch(err){
        return res.json({status:'error',error:'Error adding product'})
    }
});

app.post('/api/deleteProduct', async (req,res)=>{
    try{
        const {id}=req.body
        const product=await Product.findByIdAndDelete(id)
        if(product){
            return res.json({status:'ok'})
        }else{
            return res.json({status:'error',error:'Product not found'})
        }
    }catch(err){
        return res.json({status:'error',error:'Error deleting product'})
    }
});

app.listen(1337,()=>{
    console.log('Server is running on 1337')
})
