const mongoose=require('mongoose')

const cartSchema=new mongoose.Schema({
    user:{
        type:String,
        required:true
    },
    products:{
        typeof:Array
    }
})

const cart=mongoose.model('carts',cartSchema).collection
module.exports=cart