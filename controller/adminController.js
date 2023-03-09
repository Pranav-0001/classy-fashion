const user = require('../model/userModel')
const cart = require('../model/cartModel')
const productCollection = require('../model/productModel')
const categoryCollection = require('../model/categoryModel')
const adminCollection = require('../model/adminModel')
const mongoose = require('mongoose')
const uuid=require('uuid')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const userCollection  = require('../model/userModel')
const { ObjectId } = mongoose.Types

module.exports = {
    adminHome: (req, res) => {
        let admin = req.session.admin
        res.render('admin/home',{admin})
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
    adminAddProductPost:(req,res)=>{
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
                    Images[i].mv('./public/product-images/' + imgId[i] + '.jpg', (err, done) => {
                        if (err) {
                            console.log(err);
                        }
                    })
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
    }

}
