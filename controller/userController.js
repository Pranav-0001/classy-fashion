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
    userSignup:(req,res)=>{
        let Err = req.session.signupErr
        let signData = req.session.signupData
        let user = req.session.user
        if (user) {
            res.redirect('/')
          } else {
            res.render('user/signup', { Err, signData })
            req.session.signupErr = null
            req.session.signupData = null
          }
    },
    userSignupSubmit:async(req,res)=>{
        let userData=req.body
        let userExist=await user.findOne({email:userData.email})
        if(userExist){
            req.session.signupErr = "User Email already exist"
            req.session.signupData = req.body
            res.redirect('/signup')
        }else{
            userData.password=await bcrypt.hash(userData.password,10)
            
            userData={
                username:userData.username,
                phone:userData.phone,
                email:userData.email,
                gender:userData.gender,
                password:userData.password,
                status:true
            }
            user.insertOne(userData).then((d)=>{
                console.log(d);
            })
           
            req.session.user = req.body
            res.redirect('/')

        }
    },
    userLogin:(req,res)=>{
       let data = req.session.loginData
       let Err = req.session.loginErr
       let userExist = req.session.user
       if (userExist) {
        res.redirect('/')
      } else {
        res.render('user/login', { Err, data })
        req.session.loginErr = null
        req.session.loginData = null
      }
    },
    userLoginPost: async (req, res) => {
        let userData = req.body
        let userExist = await user.findOne({ email: userData.email })
        
        if (userExist) {
            if (userExist.status) {
                bcrypt.compare(userData.password, userExist.password).then((status) => {
                    if (status) {
                        req.session.user = userExist
                        res.redirect('/')

                    } else if (userData.password == '') {
                        response = "Password Field required"
                        req.session.loginErr = response
                        req.session.loginData = req.body
                        res.redirect('/login')
                    } else {
                        response = "Invalid Password"
                        req.session.loginErr = response
                        req.session.loginData = req.body
                        res.redirect('/login')
                    }
                }) 
            } else {
                response = "Your account is banned by admin. Please connect with our helpline"
                req.session.loginErr = response
                req.session.loginData = req.body
                res.redirect('/login')
            }
        } else if (userData.email == '') {
            response = "Email Field required"
       
            req.session.loginErr = response
            req.session.loginData = req.body
            res.redirect('/login')
        }
        else {
            response = "Invalid Email"
 
            req.session.loginErr = response
            req.session.loginData = req.body
            res.redirect('/login')
        }
    },
    userLogout:(req,res)=>{
        req.session.user=null
        res.redirect('/login')
    },
    otpLogin:(req,res)=>{
        let userExist = req.session.user
        if (userExist) {
            res.redirect('/')
        } else {
            otp = req.session.otp
            data = req.session.otpData
            err = req.session.otpErr
            invalid = req.session.InvalidOtp
            res.render('user/otp-login', { otp, data, err, invalid })
            req.session.otpErr = null
        }
    },
    sendOTP: async (req, res) => {
        let data = req.body
        let response = {}
        let userExist = await user.findOne({ email: data.email })
        if (userExist) {
            if (userExist.status) {
                otpEmail = userExist.email
                response.otp = OTP()
                
                let otp = response.otp
                let mailTransporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD
                    }
                })
                

                let details = {
                    from: "classyfashionclub123@gmail.com",
                    to: otpEmail,
                    subject: "Classy Fashion Club",
                    text: otp + " is your Classy Fashion Club verification code. Do not share OTP with anyone "
                }
                
                mailTransporter.sendMail(details, (err) => {
                    if (err) {
                        console.log("otpp-error"+err);
                    } else {
                        console.log("OTP Send Successfully ");
                    }
                })
                

                function OTP() {
                    let OTP = Math.random() * 1000000
                    OTP = Math.floor(OTP)
                    return OTP
                }
                response.user = userExist
                response.status = true

                req.session.otp = response.otp
                req.session.otpData = req.body
                req.session.otpUser = response.user
                res.redirect('/otp-login')
            } else {
                response.err = "User Email is Banned.Please Contact With us"
                req.session.otpErr = response.err
                req.session.otpData = req.body
                res.redirect('/otp-login')
            }
        } else {
            response.err = "User Email not registered"
            req.session.otpErr = response.err
            req.session.otpData = req.body
            res.redirect('/otp-login')
        }
    },
    otpLoginPost:(req,res)=>{
        let otp = req.session.otp
        let userOtp = req.body.otp
        let userData = req.session.otpUser
        if (otp == userOtp) {
            req.session.user = userData
            req.session.otp = null
            res.redirect('/')
        } else {
            req.session.InvalidOtp = "Invalid Otp"
            res.redirect('/otp-login')
        }
    },
    homePage:async(req,res)=>{
        let userExist=req.session.user
        let products=await productCollection.find().sort({_id:-1}).limit(4).toArray()
        console.log(products);
        let cartCount=0
        if(userExist){
            cartCount=await cartCout(req.session.user._id) 
        }
        res.render('user/index', { user:req.session.user, products, cartCount });

    },
    userProfile:async(req,res)=>{
        let userId=req.session.user._id
        let userData=await user.findOne({_id:ObjectId(userId)})
        res.render('user/profile', { user: req.session.user ,userData })
    },
    updateUserData:async(req,res)=>{
        let userData=req.body
        let userId=req.session.user._id
        user.updateOne({_id:ObjectId(userId)},{$set:{
            username:userData.username,
            email:userData.email,
            phone:userData.phone
        }})
        res.redirect('/profile')
    },
    changePassword:(req,res)=>{
        let upass=req.session.pass
        let response=req.session.res
        let Err=req.session.verifyErr
        res.render('user/change-password',{user:req.session.user,upass,response,Err})
        req.session.pass=null
        req.session.res=null
        req.session.verifyErr=null
    },
    verifyPassword:async(req,res)=>{
        let userId=req.session.user._id
        let userData=await user.findOne({_id:ObjectId(userId)})
           let Password=req.body
            let response={}
            bcrypt.compare(Password.password,userData.password).then((status)=>{
                if(status){
                    response.status=true
                    req.session.pass = req.body.password
                    req.session.res = response.status
                    res.redirect('/change-password')
                }else if(Password.password==''){
                    response.error = "Enter Password"
                    req.session.verifyErr = response.error
                    res.redirect('/change-password')
                }else{
                    response.error = "Wrong Password"
                    req.session.verifyErr = response.error
                    res.redirect('/change-password')
                }
               
            })
    },
    changePasswordPost:async(req,res)=>{
        let password=req.body.newpass
        let userId=req.session.user._id
        
        
        let userData=await user.findOne({_id:ObjectId(userId)})
            currPass=userData.password
            bcrypt.compare(password,currPass).then(async(status)=>{
                if(status){
                    let Err="Your new password cannot be the same as current password"
                    req.session.verifyErr=Err
                    res.redirect('/change-password')
                }else{
                    password=await bcrypt.hash(password,10)
                    user.updateOne({_id:ObjectId(userId)},{$set:{
                        password:password
                    }}).then(()=>{
                        
                        res.redirect('/')
                    })
                }
            })
        
    },
    getUserAddress:async(req,res)=>{
        let userId=req.session.user._id
        let userData =await user.findOne({ _id: ObjectId(userId)})
        let address=userData.address
        res.render('user/address', { address, user: req.session.user, address })
    },
    addAddress:(req,res)=>{
        res.render('user/add-address',{user:req.session.user})
    },
    addUserAddress:async(req,res)=>{
        let userId=req.session.user._id
        let addressData=req.body
            let count=uuid.v4()
            let address={
                name:addressData.fname+' '+addressData.lname,
                address:addressData.address,
                town:addressData.town,
                pincode:addressData.pincode, 
                state:addressData.state,
                phone:addressData.phone,
                email:addressData.email,
                index:count
            }
            user.updateOne({_id:ObjectId(userId)},{$push:{address:address}})
            res.redirect('/address-manage')
    },
    deleteAddress:(req,res)=>{
        let userId=req.session.user._id
        let indexId=req.params.index
        user.updateOne({_id:ObjectId(userId)},{$pull:{address:{index:indexId}}})
        res.redirect('/address-manage')
    },
    selectUserAddress:async(req,res)=>{
        let userId=req.session.user._id
        let userData=await user.findOne({_id:ObjectId(userId)})
        let address=userData.address
        res.render('user/select-address',{user:req.session.user,address})
    },
    showSelectedAddress:async(req,res)=>{
        let userId = req.session.user._id
        let id = req.params.id
        let selAddress=await user.aggregate([
            {
                $match:{_id:ObjectId(userId)}
            },
            {
                $unwind:'$address'
            },
            {
                $match:{'address.index':id}
            }
        ]).toArray()
       
       let data=selAddress[0].address
        let name=selAddress[0].address.name
        let arr=name.split(' ')
        
        let address={
            fname:arr[0],
            lname:arr[1],
            address:data.address,
            town:data.town,
            pincode:data.pincode,
            state:data.state,
            phone:data.phone,
            email:data.email
        }
        req.session.address=address
        res.redirect('/place-order')
    },
    wishList:async(req,res)=>{
        let userId=req.session.user._id
        let product=await wishListCollection.aggregate([
            {
                $match:{userId:ObjectId(userId)}
            },
            {
                $unwind:"$products"
            },
            {
                $project:{_id:0}
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products',
                    foreignField: '_id',
                    as: "result"
                }
            },
            {
                $project:{product: { $arrayElemAt: ['$result', 0] }}
            }
        ]).toArray()
        console.log(product);
        res.render('user/wishlist',{user:req.session.user,product})
    },
    addToWishlist:async(req,res)=>{
        console.log(req.params.id);
        let userId=req.session.user._id
        let ProId=req.params.id
        let resp={}
        let product=ObjectId(ProId)
        let checkWishlist=await wishListCollection.findOne({userId:ObjectId(userId)})

        if(checkWishlist){
            let proExist=checkWishlist.products.findIndex(product=>product==ProId)
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
        }
        res.json(resp)
    }
}
