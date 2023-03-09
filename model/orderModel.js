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
    }

})

const order=mongoose.model('order',orderSchema).collection
module.exports=order