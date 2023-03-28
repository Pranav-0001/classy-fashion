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
    getCategory:async(req,res,next)=>{
        try{
            let data = req.session.cateData
        let err = req.session.categoryErr
        let category = req.session.editCateData
        let admin = req.session.admin
        console.log(err);
        let categories= await categoryCollection.find().toArray()
        res.render('admin/categories',{categories,err,data,category,admin})
        req.session.categoryErr=null
        req.session.cateData=null
        req.session.editCateData=null
        }
        catch(err){
            next(err)
        }
    },
    addCategory:async(req,res,next)=>{
        try{
            let cate=req.body

        let regx=/^([a-zA-Z ]){3,20}$/gm
        let category=await categoryCollection.findOne({category:{$regex:cate.category,$options:"i"}})
           
            if(cate.category==''){ 
                req.session.cateData=req.body
                req.session.categoryErr="field Empty"
                res.redirect('/admin/categories')
            }else if(regx.test(cate.category)==false){
                req.session.cateData=req.body
                req.session.categoryErr="Invalid input"
                res.redirect('/admin/categories')
            }else if(category){
                req.session.cateData=req.body
                req.session.categoryErr="Category Already Exist"
                res.redirect('/admin/categories')
            }
            else{
                categoryCollection.insertOne(cate).then((data)=>{
                res.redirect('/admin/categories')
            })
            }
        }
        catch(err){
            next(err)
        }
    },
    deleteCategory:async(req,res,next)=>{
        try{
            let cateId=req.params.id
            let category=await categoryCollection.findOne({_id:ObjectId(cateId)})
           console.log(category)
           let cate=category.category
        categoryCollection.updateOne({_id:ObjectId(cateId)},{$set:{status:false}})
        productCollection.updateMany({category:cate},{$set:{status:false}}).then((data)=>{
            console.log(data);
        })
        res.redirect('/admin/categories')
        }
        catch(err){
            next(err)
        }
    },
    enableCategory:async(req,res,next)=>{
        try{
            let cateId=req.params.id
            let category=await categoryCollection.findOne({_id:ObjectId(cateId)})
           console.log(category)
           let cate=category.category
        categoryCollection.updateOne({_id:ObjectId(cateId)},{$set:{status:true}})
        productCollection.updateMany({category:cate},{$set:{status:true}}).then((data)=>{
            console.log(data);
        })
        res.redirect('/admin/categories')
        }
        catch(err){
            next(err)
        }
    },
    editCategory:async(req,res,next)=>{
        try{
            let cateId = req.params.id
        let category = await categoryCollection.findOne({ _id: ObjectId(cateId) })
        req.session.editCateData = category
        res.redirect('/admin/categories')
        }
        catch(err){
            next(err)
        }
    },
    updateCategory:async(req,res,next)=>{
        try{
            let cateId = req.params.id
            let category = await categoryCollection.findOne({ _id: ObjectId(cateId) })
            
            let cateData=category.category
            console.log(cateData);
        let cate = req.body
        let regx = /^(\w)([A-Za-z ]){1,20}/gm
        categoryCollection.updateOne({ _id: ObjectId(cateId) }, { $set: { category: cate.category } })
        productCollection.updateMany({category:cateData},{$set:{category:cate.category}})
       
        res.redirect('/admin/categories')
        }
        catch(err){
            next(err)
        }
    },
}