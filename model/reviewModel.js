const mongoose=require('mongoose')

const reviewSchema=new mongoose.Schema({
    product:{
        type:String,
        required:true
    },
    reviews:{
        type:Array
    }
})

const review=mongoose.model('review',reviewSchema).collection
module.exports=review