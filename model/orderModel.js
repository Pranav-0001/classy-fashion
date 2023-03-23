const mongoose=require('mongoose')


const orderSchema=new mongoose.Schema({
    Address:{
        type:Object,
        required:true
    },
    userId:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    products:{
        type:Array,
        required:true
    },
    subTotal:{
        type:Number,
        required:true
    },
    disTotal:{
        type:Number,
        required:true
    },
    coupon:{
        type:String
    },
    coupDiscount:{
        type:Number
    },
    paymentStatus:{
        type:String,
        required:true
    },
    timeStamp:{
        type:Number,
        required:true
    },
    month:{
        type:Number,
        required:true
    },
    reason:{
        type:String
    },
    date:{
        type:Date,
        required:true
    }


})

const order=mongoose.model('order',orderSchema).collection
module.exports=order