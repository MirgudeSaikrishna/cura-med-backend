const User = require('../models/user');
const Seller = require('../models/seller');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { name, email, password } = req.body.formdata;
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.findOne({ email: email });
    if (user) {
        return res.json({ status: 'error', error: 'Email already in use' });
    }
    try {
        await User.create({ name, email, password: hashPassword });
        return res.json({ status: 'ok' });
    } catch (err) {
        return res.json({ status: 'error', error: 'Error registering user' });
    }
};

exports.login = async (req, res) => {
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
                }, process.env.JWT_SECRET,{expiresIn : '60m'});
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
                }, process.env.JWT_SECRET,{expiresIn : '60m'});
                return res.json({ status: 'ok', user: token ,type:usertype});
            }
        }
    }
};

exports.userView = async (req, res) => {
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
};

exports.nearestSellers=async (req,res) => {
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
};

