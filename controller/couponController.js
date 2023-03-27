const user = require('../model/userModel')
const cart = require('../model/cartModel')
const productCollection = require('../model/productModel')
const categoryCollection = require('../model/categoryModel')
const adminCollection = require('../model/adminModel')
const orderCollection =require('../model/orderModel')
const couponCollection=require('../model/couponModel')
const mongoose = require('mongoose')
const uuid=require('uuid')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const userCollection  = require('../model/userModel')
const { ObjectId } = mongoose.Types
const sharp=require('sharp')

module.exports={
    couponsGet:async(req,res,next)=>{
        try{
            let coupons=await couponCollection.find().toArray()
            
            coupons.forEach((coup)=>{
                let exp=new Date(coup.expiry)
                let today=new Date()
                if(Math.round((exp-today)/(1000*60*60*24))>0){
                    coup.status="Valid"
                }else{
                    coup.status="Invalid"
                }
            })
            console.log(coupons);
        res.render('admin/coupons',{admin:req.session.admin,coupons})
        }catch(err){
            next(err)
        }
    },
    addCoupon:(req,res)=>{
        try{
            let Err=req.session.couponErr
        let couponData=req.session.couponData
        res.render('admin/add-coupon',{admin:req.session.admin,Err,couponData})
        }
        catch(err){
            next(err)
        }
    },
    addCouponPost:(req,res)=>{
       try{
        let couponData=req.body
        req.session.couponData=couponData
        let coupon=couponData.coupon
        let coupREgx=/^([A-Za-z0-9]){3,10}$/gm
        let amount=/^([0-9]){1,4}$/gm
        let disregx=/^([0-9]){1,4}$/gm
        if(couponData.coupon==''){
            req.session.couponErr="Coupon field required"
            res.redirect('/admin/add-coupon')
        }else if(couponData.expiry==''){
            req.session.couponErr="Expiry date field required"
            res.redirect('/admin/add-coupon')
        }else if(couponData.discount==''){
            req.session.couponErr="Discount field required"
            res.redirect('/admin/add-coupon')
        }else if(couponData.minAmount==''){
            req.session.couponErr="min amount field required"
            res.redirect('/admin/add-coupon')
        }else if(coupREgx.test(coupon)==false){
            req.session.couponErr="Coupon only allows A-Z and 0-9"
            res.redirect('/admin/add-coupon')
        }else if(amount.test(couponData.minAmount)==false){
            req.session.couponErr="Amount field only allows numbers"
            res.redirect('/admin/add-coupon')
        }else if(disregx.test(couponData.discount)==false){
            req.session.couponErr="Discount field only allows numbers"
            res.redirect('/admin/add-coupon')
        }else if(couponData.disType=='percentage'&&couponData.discount>=100){
            req.session.couponErr="Percentage can only set up to 100%"
            res.redirect('/admin/add-coupon')
        }else{
            let today=new Date()
            let coupon={
                coupon:couponData.coupon,
                expiry:couponData.expiry,
                minItems:parseInt(couponData.minItems),
                minAmount:parseInt(couponData.minAmount),
                disType:couponData.disType,
                discount:parseInt(couponData.discount),
                timeStamp:Math.floor(today.getTime()/1000)
            }
            couponCollection.insertOne(coupon).then(()=>{
                res.redirect('/admin/coupons')
            })
            
        }
       }catch(err){
        next(err)
       }
    },
    editCoupon:async(req,res,next)=>{
        try{
            let couponData = await couponCollection.findOne({_id:ObjectId(req.params.id)})
        res.render('admin/edit-coupon',{couponData})
        }
        catch(err){
            next(err)
        }
    },
    couponUpdate:(req,res)=>{
        try{
            console.log(req.body);
        let coupData=req.body
        couponCollection.updateOne({_id:ObjectId(req.params.id)},{$set:{
            coupon:coupData.coupon,
            expiry:coupData.expiry,
            minItems:coupData.minItems,
            minAmount:coupData.minAmount,
            discType:coupData.disType,
            discount:coupData.discount
        }})
        res.redirect('/admin/coupons')
        }catch(err){
            next(err)
        }
    },
    deleteCoupon:(req,res)=>{
        try {
            let id=req.params.id
        couponCollection.deleteOne({_id:ObjectId(id)})
        res.redirect('/admin/coupons')
        } catch (err) {
            next(err)
        }
    },
}