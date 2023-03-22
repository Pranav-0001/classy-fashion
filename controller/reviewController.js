const productCollection=require('../model/productModel')
const categoryCollection=require('../model/categoryModel')
const cartCollection=require('../model/cartModel')
const orderCollection=require('../model/orderModel')
const mongoose=require('mongoose')
const reviewCollection=require('../model/reviewModel')
const {ObjectId}=mongoose.Types
const fs=require('fs');
const uuid=require('uuid')
const sharp=require('sharp')

function CartCount(userId){
    return new Promise(async(resolve, reject) => {
        let cartData=await cartCollection.findOne({user:ObjectId(userId)})
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
    getReview:async(req,res,next)=>{
        try{
            let proId=req.params.id
        let userId=req.session.user._id
        let product=await productCollection.findOne({_id:ObjectId(proId)})
        let buy=await orderCollection.aggregate([
            {
                $match:{userId:ObjectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $match:{"products.item":ObjectId(proId)}
            }
        ]).toArray()
        let itemVali;
        if(buy.length>0){
            itemVali=true
        }else{
            itemVali=false
        }
        console.log(buy);
        res.render('user/add-review',{product,itemVali,user:req.session.user})
        }
        catch(err){
            next(err)
        }
    },
    submitReviw:async(req,res,next)=>{
        try{
            console.log(req.body)
        proId=req.params.id
        let reviewObj={
            rating:parseInt(req.body.rate),
            title:req.body.title,
            description:req.body.description,
            userId:req.session.user._id,
            username:req.session.user.username
        }
        let review=await reviewCollection.findOne({product:ObjectId(proId)})
        if(review){
            reviewCollection.updateOne({product:ObjectId(proId)},{$push:{review:reviewObj}})
        }else{
            let obj={
                product:ObjectId(proId),
                review:[reviewObj]
            }
            reviewCollection.insertOne(obj)
        }
        res.redirect('/product/'+req.params.id)
        }
        catch(err){
            next(err)
        }
    },
    getAllReview:async(req,res,next)=>{
        try {
            let proId=req.params.id
            let filter=req.session.reviewFilter
            let reviews=await reviewCollection.aggregate([
                {
                    $match:{product:ObjectId(proId)}
                },
                {
                    $unwind:'$review'
                }
            ]).toArray()
            console.log(reviews);
            if(filter){
                console.log(filter);
                if(filter=="positive"){
                    reviews=await reviewCollection.aggregate([
                        {
                            $match:{product:ObjectId(proId)}
                        },
                        {
                            $unwind:'$review'
                        },
                        {
                            $sort:{"review.rating":-1}
                        }
                    ]).toArray()
                }else if(filter=="negative"){
                    reviews=await reviewCollection.aggregate([
                        {
                            $match:{product:ObjectId(proId)}
                        },
                        {
                            $unwind:'$review'
                        },
                        {
                            $sort:{"review.rating":1}
                        }
                    ]).toArray()
                }
            }
            
            res.render('user/reviews',{reviews,filter,user:req.session.user})


        } catch (error) {
            next(error)
        }
    },
    filter:(req,res)=>{
        console.log(req.body);
        if(req.body.filter==''){
            req.session.reviewFilter=null
        }else{
            req.session.reviewFilter=req.body.filter
        }
        res.json({})
    }
}