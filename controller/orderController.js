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
    placeOrder:async(req,res)=>{
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
        let appliedCoupon={}
        if(coupApply){
            totalPrice.disTotal=coupApply.coupDisTotal
            appliedCoupon.name=coupApply.couponName,
            appliedCoupon.coupSave=coupApply.coupDiscount
        }

        console.log('coupon applied',coupApply);
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
        res.render('user/placeOrder', { totalPrice, user, Err, address ,cartCount ,cartProducts,coupons,appliedCoupon,coupValidErr })
        req.session.coupApply=null
        req.session.placeOrderErr = null
        
        req.session.coupNotValid=null
    },
    placeOrderPost:async(req,res)=>{
        let userId = req.session.user._id
        let username = req.session.user.username
        let cartProducts = await getCartProducts(userId)
        let totalPrice = await getTotalAmount(userId)
        let orderData=req.body
        let d = new Date()
        let user = await userCollection.findOne({ _id: ObjectId(userId) })
        let count = uuid.v4()
        let proCount=cartProducts.length
        let paymentMethod=orderData.payment
        let coupApply=req.session.coupApply
        let appliedCoupon={}
        if(coupApply){
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
               timeStamp:d.getTime()
               
           }
           
           if(orderData?.save=='true'){
               userCollection.updateOne({_id:ObjectId(userId)},{$push:{address:OrderObj.Address}})
           }
           if(paymentMethod=='cash'){
               orderCollection.insertOne(OrderObj).then((response) => {
                   cartCollection.deleteOne({ user: ObjectId(userId) }).then(() => {
                    res.json({COD:true})
                   })
               })
           }else{
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
    },
    verifyPayment:async(req,res)=>{
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
            let user = await userCollection.findOne({ _id: ObjectId(userId) })
            let count = uuid.v4()
            let proCount = cartProducts.length
            let orderData=req.session.deliveryDetails
            let paymentMethod = orderData.payment
            let coupApply=req.session.coupApply
            let appliedCoupon = {}
            if (coupApply) {
                totalPrice.disTotal = coupApply.coupDisTotal
                appliedCoupon.name = coupApply.couponName,
                appliedCoupon.coupSave = coupApply.coupDiscount
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
               timeStamp:d.getTime()
               
           }
            orderCollection.insertOne(OrderObj).then((response) => {
                cartCollection.deleteOne({ user: ObjectId(userId) })
            })
            res.json({orderSuccess:true})
        }else{  
            console.log("payment failed");
        }

    },
    successOrder:(req,res)=>{
        res.render('user/order-success',{user:req.session.user})
    },
    viewOrders:async(req,res)=>{
        let userId=req.session.user._id
        let cartCount=await CartCount(userId)
        let orderData=await orderCollection.find({userId:ObjectId(userId)}).sort({_id:-1}).toArray()
        res.render('user/orders',{orderData,user:req.session.user})
    },
    singleOrder:async(req,res)=>{
        let orderId = req.params.orderId
        let proId = req.params.proId
        let index = req.params.index
        let order=await orderCollection.findOne({_id:ObjectId(orderId)})
        let cartCount=await CartCount(req.session.user._id)
            let singleOrder={
                productData:order.products[index],
                address:order.Address,
                status:order.orderStatus
            }
            res.render('user/singleOrder',{singleOrder,user:req.session.user,cartCount})
    },
    cancelOrderProducts:async(req,res)=>{
        let id=req.params.id
        let orderData=await orderCollection.findOne({_id:ObjectId(id)})
        res.render('user/cancel-order',{orderData})
    },
    cancelOrderPost:(req,res)=>{
       let orderId= req.params.id
       let cancelData=req.body
       orderCollection.updateOne({_id:ObjectId(orderId)},{$set:{
        orderStatus:"userCancelPending",
        reason:cancelData.reason,
        feedback:cancelData.feedback
    }})
    res.redirect('/orders')

    },
    adminAllOrder:async(req,res)=>{
        let orders=await orderCollection.find().sort({_id:-1}).toArray()
        res.render('admin/all-orders',{admin:req.session.admin,orders})
    },
    orderDetails:async(req,res)=>{
        let orderId = req.params.id
        orderId = ObjectId(orderId)
        let order = await orderCollection.findOne({ _id: orderId })
        res.render('admin/order-details',{order})
    },
    changeOrderStatus:(req,res)=>{
        let orderId=req.params.id
        let status=req.body
        if(status.status=='Delivered'){
            orderCollection.updateOne({_id:ObjectId(orderId)},{$set:{paymentStatus:"Paid"}})
        }
        orderCollection.updateOne({_id:ObjectId(orderId)},{$set:{orderStatus:status.status}})
        res.redirect('/admin/orderdetails/'+req.params.id)
    },
    orderCancelRequest:(req,res)=>{
        let status=req.params.set

        let id=req.params.id
        if(status=='true'){
          orderCollection.updateOne({_id:ObjectId(id)},{$set:{orderStatus:"adminAcceptCancel"}}).then(()=>{
            res.redirect('/admin/all-orders')
          })
      }else{
          orderCollection.updateOne({_id:ObjectId(id)},{$set:{orderStatus:"adminRejectCancel"}}).then(()=>{
            res.redirect('/admin/all-orders')
          })
      }
    },
    applyCoupon:async(req,res)=>{
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
}

