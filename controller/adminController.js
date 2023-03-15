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
    adminHome:async (req, res) => {
        let admin = req.session.admin
        let revenue = await orderCollection.aggregate([
            {
                $match:{paymentStatus:"Paid"}
            },
            {
                $group:{_id:null,revenue:{$sum:{$convert:{input:'$discTotal',to:'int'}}}}
            }
        ]).toArray()
        console.log(revenue);
        if(revenue.length>=0) revenue=revenue[0]?.revenue;
        else revenue=0
       
        let userCount=await userCollection.countDocuments({status:true})
        let ordersCount=await orderCollection.countDocuments()
        let cancelCount=await orderCollection.countDocuments({orderStatus:'adminAcceptCancel'})
        console.log(cancelCount);
        res.render('admin/home',{admin,revenue,userCount,ordersCount,cancelCount})
    },
    adminLogin: (req, res) => {
        let admin = req.session.admin
        if (admin) {
            res.redirect('/admin')
        } else {
            err = req.session.adminLoginErr
            res.render('admin/login', { err })
            req.session.adminLoginErr = null
        }
    },
    adminLoginPost: async (req, res) => {
        let admindata = req.body

        let response = {}
        let admin = await adminCollection.findOne({ email: admindata.email })
        if (admin) {
            bcrypt.compare(admindata.password, admin.password).then((status) => {
                if (status) {
                    console.log(status);
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
    },
    adminProduct:async(req,res)=>{
        let admin=req.session.admin
        let products=await productCollection.find().toArray()
        res.render('admin/products',{products,admin})

    },
    adminAddProduct:async(req,res)=>{
        let err = req.session.addProductErr
        let data = req.session.addData
        let admin = req.session.admin
        let category= await categoryCollection.find().toArray()
        res.render('admin/add-product', { err, data, category, admin })
        req.session.addProductErr = null
        req.session.addData = null
    },
    adminAddProductPost:async(req,res)=>{
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
            console.log(count);
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
                    
                    console.log(Images);
                    let path=""+Images[i].tempFilePath
                    console.log(path);
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
    },
    adminUserList:async(req,res)=>{
        let admin=req.session.admin
        let users=await userCollection.find().toArray()
        res.render('admin/users',{users,admin})
    },
    banUser:(req,res)=>{
        let userId=req.params.id
        user.updateOne({ _id: ObjectId(userId) }, { $set: { status: false } })
        res.redirect('/admin/user-list')
    },
    unblockUser:(req,res)=>{
        let userId=req.params.id
        user.updateOne({ _id: ObjectId(userId) }, { $set: { status: true } })
        res.redirect('/admin/user-list')
    },
    deleteUser:(req,res)=>{
        let userId=req.params.id
        userCollection.deleteOne({ _id: ObjectId(userId) })
        res.redirect('/admin/user-list')
    },
    salesReport:async(req,res)=>{
        let Products=await productCollection.find().toArray()
        let sale=req.session.salesReport
        
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
                console.log(d.getMonth()+1,mnth[1]);
                if(d.getMonth()+1==mnth[1]){
                    return order
                }
                 
            })
            console.log(salesData);
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
        }
        let revenue = await orderCollection.aggregate([
            {
                $match:{orderStatus:"Delivered"}
            },
            {
                $group:{_id:null,revenue:{$sum:{$convert:{input:'$discTotal',to:'int'}}}}
            }
        ]).toArray()
        if(revenue.length>0)  revenue=revenue[0].revenue;
        else revenue=0
        res.render('admin/sales-report',{salesData,admin:req.session.admin,revenue,sale})
        req.session.salesReport=null
    },
    salesReportPost:(req,res)=>{
        req.session.salesReport=req.body.opt
        res.json({status:true})
    },
    couponsGet:async(req,res)=>{
        let coupons=await couponCollection.find().toArray()
        res.render('admin/coupons',{admin:req.session.admin,coupons})
    },
    addCoupon:(req,res)=>{
        let Err=req.session.couponErr
        let couponData=req.session.couponData
        res.render('admin/add-coupon',{admin:req.session.admin,Err,couponData})
    },
    addCouponPost:(req,res)=>{
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
                discount:couponData.discount,
                timeStamp:Math.floor(today.getTime()/1000)
            }
            couponCollection.insertOne(coupon).then(()=>{
                res.redirect('/admin/coupons')
            })
            
        }
    }

}
