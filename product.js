const mongoose =require('mongoose')
const Product=new mongoose.Schema(
    {
    name:{type:String,required:true},
    price:{type:Number,required:true},
    description:{type:String,required:true},
    },
    {Collection:'product-data'}
)
const model=mongoose.model('Product',Product)
module.exports=model;