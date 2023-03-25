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

module.exports = {
    adminHome:async (req, res ,next) => {
        try{
            let admin = req.session.admin
        let revenue = await orderCollection.aggregate([
            {
                $match:{paymentStatus:"Paid"}
            },
            {
                $group:{_id:null,revenue:{$sum:{$convert:{input:'$discTotal',to:'int'}}}}
            }
        ]).toArray()
        
        if(revenue.length>0) revenue=revenue[0]?.revenue;
        else revenue=0
       
        let userCount=await userCollection.countDocuments({status:true})
        let ordersCount=await orderCollection.countDocuments()
        let cancelCount=await orderCollection.countDocuments({orderStatus:'adminAcceptCancel'})
        
        
        
        res.render('admin/home',{admin,revenue,userCount,ordersCount,cancelCount})
        }catch(err){
            next(err)
        }
        
    },
    adminLogin: (req, res) => {
        try{
            let admin = req.session.admin
        if (admin) {
            res.redirect('/admin')
        } else {
            err = req.session.adminLoginErr
            res.render('admin/login', { err ,login:true})
            req.session.adminLoginErr = null
        }
        }catch(err){
            next(err)
        }
    },
    adminLoginPost: async (req, res ,next) => {
        try {
            let admindata = req.body

        let response = {}
        let admin = await adminCollection.findOne({ email: admindata.email })
        if (admin) {
            bcrypt.compare(admindata.password, admin.password).then((status) => {
                if (status) {
                    
                    response.admin = admin
                    response.status = true
                    req.session.admin = response.admin
                    res.redirect('/admin')

                } else if (admindata.password == '') {
                    response.msg = "Password Field required"
                    req.session.adminLoginErr = response.msg
                    res.redirect('/admin/login')
                } else {
                    response.msg = "Invalid Password"
                    req.session.adminLoginErr = response.msg
                    res.redirect('/admin/login')
                }
            })
        } else if (admindata.email == '') {
            response.msg = "Email Field required"
            req.session.adminLoginErr = response.msg
            res.redirect('/admin/login')
        } else {
            response.msg = "Invalid Email"
            req.session.adminLoginErr = response.msg
            res.redirect('/admin/login')
        }
        } catch (err) {
            next(err)
        }
        
    },
    adminProduct:async(req,res ,next)=>{
        try{
            let admin=req.session.admin
            let limit=10
            let skip=0
            if(req.session.adProPage){
               skip=(req.session.adProPage-1)*10 
            }
            
        let products=await productCollection.find().limit(limit).skip(skip).sort({_id:-1}).toArray()
        let proCount=await productCollection.countDocuments()
        let c1=Math.ceil(proCount/limit)
        let pageArr=[]
        for(i=0;i<c1;i++){
            pageArr.push(i+1)
        }
        res.render('admin/products',{products,admin,pageArr})
        }
        catch(err){
            next(err)
        }

    },
    adminAddProduct:async(req,res,next)=>{
        try{
            let err = req.session.addProductErr
        let data = req.session.addData
        let admin = req.session.admin
        let category= await categoryCollection.find().toArray()
        res.render('admin/add-product', { err, data, category, admin })
        req.session.addProductErr = null
        req.session.addData = null
        }
        catch(err){
            next(err)
        }
    },
    adminAddProductPost:async(req,res,next)=>{
        try{
            let Images = req.files.images
        req.session.addData = req.body
        let productData=req.body
        let response={}
        if (Images.length > 5) {
            response.err = "Max 5 images are allowed"
            resolve(response.err);
        } else if (Images.length < 2) {
            response.err = "5 Images Required"
            resolve(response.err);
        } else if (!productData.S && !productData.M && !productData.L && !productData.XL && !productData.XXL) {
            response.err = "Should select one size"
            resolve(response.err);
        } else {
            let count = Images.length
           
            let imgId = []
            let size = []
            if (productData.S == 'on') size.push('S'); else size.push('')
            if (productData.M == 'on') size.push('M'); else size.push('')
            if (productData.L == 'on') size.push('L'); else size.push('')
            if (productData.XL == 'on') size.push('XL'); else size.push('')
            if (productData.XXL == 'on') size.push('S'); else size.push('')

            if (count) {
                for (i = 0; i < count; i++) {

                    imgId[i] = uuid.v4()
                    
                   
                    let path=""+Images[i].tempFilePath
                    
                    await sharp(path)
                        .rotate()
                        .resize(540, 720)
                        .jpeg({ mozjpeg: true })
                        .toFile(`./public/product-images/${imgId[i]}.jpg`)
                }
                productData.price = parseInt(productData.price)
                productData.discount = parseInt(productData.discount)
                productData.stock = parseInt(productData.stock) 

                let offer = (productData.price * productData.discount) / 100
                let offerPrice = productData.price - offer
                productData.offerPrice = parseInt(offerPrice)
                productData.savings = parseInt(offer)
                productData.size = size



                productData.Images = imgId
                productCollection.insertOne(productData).then((data) => {
                    response.status = true
                    res.redirect('/admin/products')
                })
            } else {
                response.err = "Minimum 2 images Required"
                req.session.addProductErr = response.err
                res.redirect('/admin/add-product')
            }
        }
        }catch(err){
            next(err)
        }
    },
    adminUserList:async(req,res,next)=>{
        try{
            let admin=req.session.admin
            let filter=req.session.userFilter
            
        let users=await userCollection.find().toArray()
        
        if(filter){
            
           if(filter=="banned"){
            users=await userCollection.find({status:false}).toArray()
           }else if(filter=='active'){
            users=await userCollection.find({status:true}).toArray()
           }else{
            users=await userCollection.find().toArray()
           }
            
        }
        res.render('admin/users',{users,admin,filter})
        }
        catch(err){
            next(err)
        }
    },
    banUser:(req,res)=>{
        try{
            let userId=req.params.id
        user.updateOne({ _id: ObjectId(userId) }, { $set: { status: false } })
        res.redirect('/admin/user-list')
        }
        catch(err){
            next(err)
        }
    },
    unblockUser:(req,res)=>{
        try {
            let userId=req.params.id
        user.updateOne({ _id: ObjectId(userId) }, { $set: { status: true } })
        res.redirect('/admin/user-list')
        } catch (err) {
            next(err)
        }
        
    },
    deleteUser:(req,res)=>{
        let userId=req.params.id
        userCollection.deleteOne({ _id: ObjectId(userId) })
        res.redirect('/admin/user-list')
    },
    salesReport:async(req,res,next)=>{
        try{
            let Products=await productCollection.find().toArray()
        let sale=req.session.salesReport
        let range=req.session.salesReportRange
        
        let salesData=await orderCollection.find({paymentStatus:"Paid"}).sort({timeStamp:-1}).toArray()
        if(sale=='today'){
             let d=new Date()
             let newDate=`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`
             salesData=await orderCollection.find({'Address.date':newDate,paymentStatus:"Paid"}).toArray()
        }else if(sale=='month'){
            let sales=await orderCollection.find({paymentStatus:"Paid"}).toArray()
            salesData=sales.map((order)=>{
                let d=new Date()
                let date=order.Address.date
                let mnth=date.split('/')
                
                if(d.getMonth()+1==mnth[1]){
                    return order
                }
                 
            })
            
        }else if(sale=='year'){
            let sales=await orderCollection.find({paymentStatus:"Paid"}).toArray()
            salesData=sales.map((order)=>{
                let d=new Date()
                let date=order.Address.date
                let mnth=date.split('/')
                console.log(d.getFullYear,mnth[2]);
                if(d.getFullYear()==mnth[2]){
                    return order
                }
                 
            })
        }else if(sale=='new'){
            console.log(sale);
            salesData=await orderCollection.find({paymentStatus:"Paid"}).sort({timeStamp:-1}).toArray()
        }else if(sale=='old'){
            console.log(sale);
            salesData=await orderCollection.find({paymentStatus:"Paid"}).sort({timeStamp:1}).toArray()
        }else if(range){
            let start=range.start
            let end=range.end
            salesData=await orderCollection.find({date:{$gte:new Date(start).toISOString(),$lt:new Date(end).toISOString()}}).toArray()
            console.log(new Date(start).toISOString());
        }
        let revenue = await orderCollection.aggregate([
            {
                $match:{paymentStatus:"Paid"}
            },
            {
                $group:{_id:null,revenue:{$sum:{$convert:{input:'$discTotal',to:'int'}}}}
            }
        ]).toArray()
        if(revenue.length>0)  revenue=revenue[0].revenue;
        else revenue=0
        res.render('admin/sales-report',{salesData,admin:req.session.admin,revenue,sale,range})
        req.session.salesReport=null
        req.session.salesReportRange=null
        }
        catch(err){
            next(err)
        }
    },
    salesReportPost:(req,res)=>{
        try{
            req.session.salesReport=req.body.opt
        res.json({status:true})
        }catch(err){
            next(err)
        }
    },
    bannerImage:async(req,res,next)=>{
        try{
            res.render('admin/banner',{admin:req.session.admin})
        } catch(err){
            next(err)
        }
    },
    bannerUpdate:async(req,res,next)=>{
        try{
            console.log(req.files);
        if(req.files?.mainBanner){
            let path=req.files.mainBanner.tempFilePath
            await sharp(path)
                .rotate()
                .resize(1920, 720)
                .jpeg({ mozjpeg: true })
                .toFile(`./public/Banner-images/banner.jpg`)
        }

        if(req.files?.subBanner){
            let path=req.files.subBanner.tempFilePath
            await sharp(path)
                .rotate()
                .resize(1148, 568)
                .jpeg({ mozjpeg: true })
                .toFile(`./public/Banner-images/banner2.jpg`)
        }

        res.redirect('/admin/banner-image')
        }
        catch(err){
            next(err)
        }
    },
    
    orderFilter:(req,res)=>{
        console.log(req.body);
        req.session.orderFilter=req.body
        res.json({})
    },
    userFilter:(req,res)=>{
        console.log("djg",req.body);
        req.session.userFilter=req.body.filter
        res.json({})
    },
    chartData:async(req,res,next)=>{
        try{
            console.log("call success");
        let monthWise=await orderCollection.aggregate([
            {
                $group:{_id:"$month",revenue:{$sum:"$discTotal"}}
            },
            {
                $sort:{_id:1}
            }
        ]).toArray()
        console.log(monthWise);
        res.json(monthWise)
        }
        catch(err){
            next(err)
        }
    },
    returnAccept:async(req,res,next)=>{
        try {
            let status = req.params.response
            let id = req.params.id
            
            let order=await orderCollection.findOne({_id:ObjectId(id)})
            let amount=order.discTotal
            if(order.coupon!=null){
                amount-=order.coupDiscount
            }
            if (status == "true") {
                orderCollection.updateOne({ _id: ObjectId(id) }, { $set: { orderStatus: "returnConfirmed",paymentStatus:"refunded" } })
                userCollection.updateOne({_id:order.userId},{$inc:{wallet:amount}})
            }
            else{
                orderCollection.updateOne({ _id: ObjectId(id) }, { $set: { orderStatus: "Delivered" } })
            }
            res.redirect('/admin/all-orders')
        }
        catch (err) {
            next(err)
        }
    },
    salesReportRange:(req,res,next)=>{
        console.log(req.body);
        req.session.salesReportRange=req.body
        res.json({})
    },
    pagination:(req,res)=>{
        req.session.adProPage=req.params.id
        res.redirect('/admin/products')
    }

}
