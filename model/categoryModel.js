const mongoose=require('mongoose')

const categorySchema=new mongoose.Schema({
    category:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        required:true
    }
})

const category=mongoose.model('category',categorySchema).collection
module.exports=category