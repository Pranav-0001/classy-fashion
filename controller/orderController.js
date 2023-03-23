const productCollection=require('../model/productModel')
const categoryCollection=require('../model/categoryModel')
const cartCollection=require('../model/cartModel')
const orderCollection=require('../model/orderModel')
const couponCollection=require('../model/couponModel')
const mongoose=require('mongoose')
const  userCollection  = require('../model/userModel')
const uuid=require('uuid')
const {ObjectId}=mongoose.Types
require('dotenv').config()

const Razorpay=require('razorpay')


var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
  });

function getCartProducts(userId){
    return new Promise(async(resolve, reject) => {
        let cartItems=await cartCollection.aggregate([
            {
                $match:{user:ObjectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity',
                    size:'$products.size'
                }
            },{
                $lookup:{
                    from:'products',
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,quantity:1,size:1,product:{$arrayElemAt:['$product',0]}
                }
            }
        ]).toArray()
        cartItems[0].proTotal=cartItems[0].quantity*cartItems[0].product.offerPrice

        

        console.log(cartItems);
        resolve(cartItems)

    })
}
function getTotalAmount(userId){
    return new Promise(async (resolve, reject) => {
        let total = await cartCollection.aggregate([
            {
                $match: { user: ObjectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            }, {
                $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.price', to: 'int' } }] } },
                    disTotal: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.offerPrice', to: 'int' } }] } }
                }
            }
        ]).toArray()
        resolve(total[0])
    })
}
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
    placeOrder:async(req,res,next)=>{
        try{
            let Err=req.session.placeOrderErr
        let user = req.session.user
        let cartCount=await CartCount(user._id)
        let totalPrice =await getTotalAmount(req.session.user._id)
        totalPrice.saving = totalPrice.total - totalPrice.disTotal
        let address = req.session.address
        let cartProducts = await getCartProducts(req.session.user._id)
        let coupons= await couponCollection.find().toArray()
        let coupApply=req.session.coupApply
        let coupValidErr=req.session.coupNotValid
        let userData= await userCollection.findOne({_id:ObjectId(user._id)})
        let appliedCoupon={}
        if(coupApply){
            totalPrice.disTotal=coupApply.coupDisTotal
            appliedCoupon.name=coupApply.couponName,
            appliedCoupon.coupSave=coupApply.coupDiscount
        }
        let walletAmt=req.session.walletAmt
        if(walletAmt){
            totalPrice.disTotal= (totalPrice.disTotal)-parseInt(walletAmt)
            userData.wallet=0
        }
        
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
        res.render('user/placeOrder', { totalPrice, user, Err, address ,cartCount ,cartProducts,coupons,appliedCoupon,coupValidErr,userData,walletAmt })
        
        req.session.placeOrderErr = null
        
        req.session.coupNotValid=null
        }
        catch(err){
            next(err)
        }
    },
    placeOrderPost:async(req,res,next)=>{
        try{
            let userId = req.session.user._id
        let username = req.session.user.username
        let cartProducts = await getCartProducts(userId)
        let totalPrice = await getTotalAmount(userId)
        let orderData=req.body
        let d = new Date()
        let mon=(d.getMonth()/10<1)?'0'+(d.getMonth()+1):d.getMonth()+1
        let user = await userCollection.findOne({ _id: ObjectId(userId) })
        let count = uuid.v4()
        let proCount=cartProducts.length
        let paymentMethod=orderData.payment
        console.log(req.session.coupApply);
        let coupApply=req.session.coupApply
        let appliedCoupon={}
        console.log("out",coupApply);
        if(coupApply){
            console.log("in",coupApply);
            totalPrice.disTotal=coupApply.coupDisTotal
            appliedCoupon.name=coupApply.couponName,
            appliedCoupon.coupSave=coupApply.coupDiscount
        }
        
        console.log("pay",paymentMethod);
            for(i=0;i<proCount;i++){
                let produId=cartProducts[i].item
                let sale=(cartProducts[i].quantity)
                productCollection.updateOne({_id:produId},{$inc:{sales:sale}})
                
                let qty=-(cartProducts[i].quantity)
                console.log(produId,qty);
                let product=await productCollection.findOne({_id:produId})
                productCollection.updateOne({_id:produId},{$inc:{stock:qty}})
                let sales=product.sales
                let offerPrice=product.offerPrice   
                let reven=sales*offerPrice
                productCollection.updateOne({_id:produId},{$set:{rev:reven}})
            }
            let OrderObj={
                Address:{
                   name:orderData.fname+' '+orderData.lname,
                   address:orderData.address,
                   town:orderData.town,
                   pincode:orderData.pincode,
                   state:orderData.state,
                   phone:orderData.phone,
                   email:orderData.email,
                   date:`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
                   payment:orderData.payment,
                   index:count
               },
               userId:ObjectId(userId),
               username:username,
               products:cartProducts,
               subTotal:totalPrice.total,
               discTotal:totalPrice.disTotal,
               coupon:appliedCoupon.name,
               coupDiscount:appliedCoupon.coupSave,
               orderStatus:"orderPlaced",
               paymentStatus:(paymentMethod=='cash')?"Pending":"Paid",
               timeStamp:d.getTime(),
               month:d.getMonth()+1,
               date:`${d.getFullYear()}-${mon}-${d.getDate()}`
               
           }
           
           if(orderData?.save=='true'){
               userCollection.updateOne({_id:ObjectId(userId)},{$push:{address:OrderObj.Address}})
           }
           if(paymentMethod=='cash'){
               orderCollection.insertOne(OrderObj).then((response) => {
                   cartCollection.deleteOne({ user: ObjectId(userId) }).then(() => {
                       let walletAmt = req.session.walletAmt
                       if (walletAmt) {
                           userCollection.updateOne({ _id: ObjectId(userId) }, { $set: { wallet: 0 } })
                       }
                    res.json({COD:true})

                   })
               })
               
           }
           else if (paymentMethod == 'wallet') {
            let amt=-(totalPrice.disTotal)
            userCollection.updateOne({_id:ObjectId(userId)},{$inc:{wallet:amt}})
            orderCollection.insertOne(OrderObj).then((response) => {
                cartCollection.deleteOne({ user: ObjectId(userId) }).then(() => {
                 res.json({COD:true})
                })
            })
           }
           
           else{
            let walletAmt = req.session.walletAmt
            if (walletAmt) {
                totalPrice.disTotal = (totalPrice.disTotal) - parseInt(walletAmt)
            }
            let order_id = uuid.v4()
            var options ={
                amount: totalPrice.disTotal*100,
                currency: "INR",
                receipt:order_id,
            };
            req.session.deliveryDetails=orderData
            
            instance.orders.create(options,function(err,order){
                if (err) console.log(err);
                console.log(order)
                res.json(order)
            })
               
           }
           req.session.address = null
        }
        catch(err){
            next(err)
        }
           
    },
    verifyPayment:async(req,res,next)=>{
        try{
            console.log("aaasssssqqqwww",req.body);
        let details=req.body
        const crypto=require('crypto')
        let hmac=crypto.createHmac('sha256','wkCYl3fic8fJv3nXbkRPc7qx')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
        hmac=hmac.digest('hex')
        console.log(hmac);
        if(hmac==details['payment[razorpay_signature]']){
            console.log('order success',req.session.orderObject)
            let userId = req.session.user._id
            let username = req.session.user.username
            let cartProducts = await getCartProducts(userId)
            let totalPrice = await getTotalAmount(userId)
            let d = new Date()
            let mon=(d.getMonth()/10<1)?'0'+(d.getMonth()+1):d.getMonth()+1
            let user = await userCollection.findOne({ _id: ObjectId(userId) })
            let count = uuid.v4()
            let proCount = cartProducts.length
            let orderData=req.session.deliveryDetails
            let paymentMethod = orderData.payment
            let coupApply=req.session.coupApply
            let appliedCoupon = {}
            console.log("outer",coupApply);
            if (coupApply) {
                console.log("in",coupApply);
                totalPrice.disTotal = coupApply.coupDisTotal
                appliedCoupon.name = coupApply.couponName,
                appliedCoupon.coupSave = coupApply.coupDiscount
            }
            let walletAmt = req.session.walletAmt
            if (walletAmt) {
                userCollection.updateOne({_id:ObjectId(userId)},{$set:{wallet:0}})
            }
            
            let OrderObj={
                Address:{
                   name:orderData.fname+' '+orderData.lname,
                   address:orderData.address,
                   town:orderData.town,
                   pincode:orderData.pincode,
                   state:orderData.state,
                   phone:orderData.phone,
                   email:orderData.email,
                   date:`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
                   payment:orderData.payment,
                   index:count
               },
               userId:ObjectId(userId),
               username:username,
               products:cartProducts,
               subTotal:totalPrice.total,
               discTotal:totalPrice.disTotal,
               coupon:appliedCoupon.name,
               coupDiscount:appliedCoupon.coupSave,
               orderStatus:"orderPlaced",
               paymentStatus:(paymentMethod=='cash')?"Pending":"Paid",
               timeStamp:d.getTime(),
               month:d.getMonth()+1,
               date:`${d.getFullYear()}-${mon}-${d.getDate()}`
               
           }
            orderCollection.insertOne(OrderObj).then((response) => {
                cartCollection.deleteOne({ user: ObjectId(userId) })
            })
            res.json({orderSuccess:true})
        }else{  
            console.log("payment failed");
        }
        req.session.coupApply=null
        }
        catch(err){
            next(err)
        }
    },
    successOrder:(req,res)=>{
        res.render('user/order-success',{user:req.session.user})
    },
    viewOrders:async(req,res,next)=>{
        try{
            let userId=req.session.user._id
        let cartCount=await CartCount(userId)
        let orderData=await orderCollection.find({userId:ObjectId(userId)}).sort({_id:-1}).toArray()
        res.render('user/orders',{orderData,user:req.session.user})
        }
        catch(err){
            next(err)
        }
    },
    singleOrder:async(req,res,next)=>{
        try{
            let orderId = req.params.id
        
        
        let order=await orderCollection.findOne({_id:ObjectId(orderId)})
        let cartCount=await CartCount(req.session.user._id)
            
        res.render('user/singleOrder',{order,user:req.session.user,cartCount})
        }
        catch(err){
            next(err)
        }
    },
    cancelOrderProducts:async(req,res,next)=>{
        try{
            let id=req.params.id
        let orderData=await orderCollection.findOne({_id:ObjectId(id)})
        res.render('user/cancel-order',{orderData})
        }
        catch(err){
            next(err)
        }
    },
    cancelOrderPost:(req,res)=>{
       try{
        let orderId= req.params.id
       let cancelData=req.body
       orderCollection.updateOne({_id:ObjectId(orderId)},{$set:{
        orderStatus:"userCancelPending",
        reason:cancelData.reason,
        feedback:cancelData.feedback
    }})
    res.redirect('/orders')
       }
       catch(err){
        next(err)
       }
    },
    adminAllOrder:async(req,res,next)=>{
        try {
            let orders=await orderCollection.find().sort({_id:-1}).toArray()
            let filter=req.session.orderFilter
            let opt
            if(filter){
               opt=req.session.orderFilter.filter 
               if(filter.filter!=''){
                orders=await orderCollection.find({orderStatus:filter.filter}).sort({_id:-1}).toArray()
            }
            }
            
            
            
        res.render('admin/all-orders',{admin:req.session.admin,orders,opt})
        } catch (err) {
            next(err)
        }
    },
    orderDetails:async(req,res,next)=>{
        try{
            let orderId = req.params.id
        orderId = ObjectId(orderId)
        let order = await orderCollection.findOne({ _id: orderId })
        res.render('admin/order-details',{order,admin:req.session.admin})
        }catch(err){
            next(err)
        }
    },
    changeOrderStatus:(req,res)=>{
        try{
            let orderId=req.params.id
        let status=req.body
        if(status.status=='Delivered'){
            orderCollection.updateOne({_id:ObjectId(orderId)},{$set:{paymentStatus:"Paid"}})
        }
        orderCollection.updateOne({_id:ObjectId(orderId)},{$set:{orderStatus:status.status}})
        res.redirect('/admin/orderdetails/'+req.params.id)
        }
        catch(err){
            next(err)
        }
    },
    orderCancelRequest:async(req,res,next)=>{
        try{
            let status=req.params.set

        let id=req.params.id
        if(status=='true'){
            let orderData=await orderCollection.findOne({_id:ObjectId(id)})
            let userId=orderData.userId
            let amount=parseInt(orderData.discTotal)
            console.log(userId,amount);
            if(orderData.paymentStatus=="Paid"){
                userCollection.updateOne({_id:userId},{$inc:{wallet:amount}})
                orderCollection.updateOne({_id:userId},{$set:{paymentStatus:"refunded"}})
            }
          orderCollection.updateOne({_id:ObjectId(id)},{$set:{orderStatus:"adminAcceptCancel"}}).then(()=>{
            res.redirect('/admin/all-orders')
          })
      }else{
          orderCollection.updateOne({_id:ObjectId(id)},{$set:{orderStatus:"adminRejectCancel"}}).then(()=>{
            res.redirect('/admin/all-orders')
          })
      }
        }
        catch(err){
            next(err)
        }
    },
    applyCoupon:async(req,res,next)=>{
        try{
            let code=req.body.code
        let coupon=await couponCollection.findOne({coupon:code})
        let totalPrice=await getTotalAmount(req.session.user._id)
        let cartCount=await CartCount(req.session.user._id)
        if(coupon){
            console.log(coupon);
            let items=coupon.minItems
            let minAmt=coupon.minAmount
            let discount=parseInt(coupon.discount)
            let total=totalPrice.disTotal
            let expiry=new Date(coupon.expiry)
            let today=new Date()
            let exp=(expiry-today)/1000*60*60*24
            console.log(exp);
            console.log(totalPrice);
            if(cartCount>=items && total>=minAmt && exp>0 ){
                console.log('applicable');
                if(coupon.disType=='percentage'){
                    let disAmt=(total*discount)/100
                    total=total-disAmt
                    total=Math.floor(total)
                    let coupData={
                        coupDiscount:disAmt,
                        coupDisTotal:total,
                        couponName:coupon.coupon
                    }
                    req.session.coupApply=coupData
                }else{
                    let disAmt=discount
                    total-=disAmt
                    total=Math.floor(total)
                    let coupData={
                        coupDiscount:disAmt,
                        coupDisTotal:total,
                        couponName:coupon.coupon
                    }
                    req.session.coupApply=coupData
                }
                res.json({apply:true})
            }else{
                console.log("Not applicable");
                req.session.coupNotValid="Coupon not applicable on this order"
                res.json({apply:false})
            }

        }else{
            console.log('invalid');
            req.session.coupNotValid="Invalid Coupon"
            res.json({invalid:true})
        }
        }
        catch(err){
            next(err)
        }
        
    },
    useWallet:async(req,res,next)=>{
        try{
            console.log("calll");
        let userId=req.session.user._id
        let user=await userCollection.findOne({_id:ObjectId(userId)})
        let walletAmt=user.wallet
        req.session.walletAmt=walletAmt
        
        res.json({})
        }
        catch(err){
            next(err)
        }
    },
    disableWallet:(req,res)=>{
        req.session.walletAmt=null
        res.json({})
    },
    removeCoupon:(req,res)=>{
        req.session.coupApply=null
        res.redirect('/place-order')
    },
    orderReturn:(req,res)=>{
        console.log(req.body);
        orderCollection.updateOne({_id:ObjectId(req.body.id)},{$set:{orderStatus:"returnPending",reason:req.body.reason}})
        res.json({})
    }  
     
}

