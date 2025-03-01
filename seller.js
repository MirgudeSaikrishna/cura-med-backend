const mongoose = require('mongoose');
const seller=new mongoose.Schema(
    {
        shopName:{type:String,required:true},
        email:{type:String,required:true},
        password:{type:String,required:true},
        phone:{type:Number,required:true},
        address:{type:String,required:true},
    },
    {Collection:'seller'}
)
const model=mongoose.model('Seller',seller)
module.exports=model;