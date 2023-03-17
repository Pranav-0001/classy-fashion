const mongoose=require('mongoose')

const wishlistSchema=new mongoose.Schema({
    user:{
        type:String,
        required:true
    },
    products:{
        type:Array
    }
})

const wishList=mongoose.model('wishlist',wishlistSchema).collection
module.exports=wishList