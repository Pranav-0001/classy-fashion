const mongoose=require('mongoose')

const wishlistSchema=new mongoose.Schema({
    user:{
        type:String,
        required:true
    },
    products:{
        typeof:Array
    }
})

const wishList=mongoose.model('wishlist',wishlistSchema).collection
module.exports=wishList