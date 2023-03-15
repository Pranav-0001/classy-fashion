const mongoose=require('mongoose')

const couponSchema=new mongoose.Schema({
    coupon:{
        type:String,
        required:true
    },
    expiry:{
        type:Date,
        required:true
    },
    minimumItems:{
        type:Number,
        required:true
    },
    discountType:{
        type:String,
        required:true
    },
    discountAmout:{
        type:Number,
        required:true
    }
})

const coupon=mongoose.model('coupon',couponSchema).collection
module.exports=coupon