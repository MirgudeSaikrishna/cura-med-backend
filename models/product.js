const mongoose =require('mongoose')
const Product=new mongoose.Schema(
    {
    seller:{type:String,required:true},
    name:{type:String,required:true},
    price:{type:Number,required:true},
    description:{type:String,required:true},
    },
    {Collection:'product-data'}
)
const model=mongoose.model('Product',Product)
module.exports=model;