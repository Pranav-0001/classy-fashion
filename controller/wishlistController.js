const user=require('../model/userModel')
const cart=require('../model/cartModel')
const productCollection=require('../model/productModel')
const categoryCollection=require('../model/categoryModel')
const wishListCollection=require('../model/wishlistModel')
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')
const nodemailer=require('nodemailer')
const category = require('../model/categoryModel')
const {ObjectId}=mongoose.Types
const uuid=require('uuid')
const { response } = require('../app')

require('dotenv').config()


function cartCout(userId){
    return new Promise(async(resolve, reject) => {
        let cartData=await cart.findOne({user:ObjectId(userId)})
        if(cartData){
            var  count=cartData.products.length
            resolve(count);
        }else{
            var count=0
            resolve(count)
        }
    })
}


module.exports={
    wishList:async(req,res,next)=>{
        try{
            let userId=req.session.user._id
        let product=await wishListCollection.aggregate([
            {
                $match:{userId:ObjectId(userId)}
            },
            {
                $unwind:"$products"
            },
            {
                $project:{_id:0,
                product:'$products.product',
                size:'$products.size'}
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: "result"
                }
            },
            {
                $project:{product: { $arrayElemAt: ['$result', 0] } ,size:1}
            }
        ]).toArray()
        console.log(product);
        let cartCount=await cartCout(userId)
        res.render('user/wishlist',{user:req.session.user,product,cartCount})
        }
        catch(err){
            next(err)
        }
    },
    addToWishlist:async(req,res,next)=>{
        try{
            console.log(req.body);
        let userId=req.session.user._id
        let ProId=req.params.id
        let resp={}
        let product={product:ObjectId(ProId),size:req.body.size}
        let checkWishlist=await wishListCollection.findOne({userId:ObjectId(userId)})
    
        if(checkWishlist){
            let proExist=checkWishlist.products.findIndex(product=>product.product==ProId)
            console.log(proExist);
            if(proExist!=-1){
                resp.exist=true
            }else{
               wishListCollection.updateOne({userId:ObjectId(userId)},{
                $push:{products:product}
                
            }) 
            resp.status=true
            }
            
        }else{
            let wishListObj={
                userId:ObjectId(userId),
                products:[product]
            }
            wishListCollection.insertOne(wishListObj)
            resp.status=true
        }
        res.json(resp)
        }
        catch(err){
            next(err)
        }
    },
    removeWishlistProduct:(req,res)=>{
        let proId=req.params.id
        let userId=req.session.user._id
        wishListCollection.updateOne({userId:ObjectId(userId)},{$pull:{products:{product:ObjectId(proId)}}})
        res.redirect('/wishlist')
    }
}