const mongoose=require('mongoose')

const userSchema1=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        required:true
    },
    address:{
        type:Array
    }
})

const user=mongoose.model('users',userSchema1).collection
module.exports=user