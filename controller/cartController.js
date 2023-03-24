const productCollection=require('../model/productModel')
const categoryCollection=require('../model/categoryModel')
const cartCollection=require('../model/cartModel')
const mongoose=require('mongoose')
const {ObjectId}=mongoose.Types

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

function getCartTotal(userId){
    console.log(userId);
    return new Promise(async(resolve, reject) => {
        let total=await cartCollection.aggregate([
            {
                $match:{user:ObjectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
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
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            },
            {
                $group:{
                    _id:null,
                    total:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.price',to:'int'}}]}},
                    disTotal:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.offerPrice',to:'int'}}]}}
                }
            }
        ]).toArray()
        resolve(total[0])
    })
}

module.exports={
    cart: async (req, res ,next) => {
       try {
        req.session.walletAmt=null
        let user = req.session.user
        let userId=req.session.user._id
        let cartCount = await CartCount(userId)
        let total;
        if (cartCount > 0) {
            total = await getCartTotal(userId)
            let savings = total.total - total.disTotal
            let disc = Math.floor((savings * 100) / total.total)
            let delivery = (total.disTotal < 1500) ? 100 : null;
            total.disTotal = total.disTotal + delivery
            total.savings = savings
            total.disc = disc
            total.delivery = delivery
        }
        

        let products = await cartCollection.aggregate([
            {
                $match: { user: ObjectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity',
                    size: '$products.size'
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
                    item: 1, quantity: 1, size: 1, product: { $arrayElemAt: ['$product', 0] }
                }
            }
        ]).toArray()

       let outOfStk=null
        products.forEach(product=>{
            if(product.product.stock <= 0){
                product.out=true
                outOfStk=true
            }
        })
        console.log(products);

        res.render('user/cart', { user: req.session.user, products, cartCount,total,outOfStk })
        req.session.address = null
        req.session.coupApply = null
       } catch (err) {
        next(err)
       }
    },
    addToCart:async(req,res,next)=>{
        try{
            let proId = req.params.id
        let userId = req.session.user._id
        let size=req.body.Size
        let proObj={
            item:ObjectId(proId),
            quantity:1,
            size:size
        }
        let userCart=await cartCollection.findOne({user:ObjectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=>product.item==proId && product.size==size)
            console.log(proExist);
            
            if(proExist!=-1 ){
                res.redirect('/cart')
            }else{
                cartCollection.updateOne({user:ObjectId(userId)},{
                    $push:{products:proObj}
                }).then(()=>{ 
                    res.redirect('/cart')
                })
            }
        }else{
            let cartObj={
                user:ObjectId(userId),
                products:[proObj]
            }
            cartCollection.insertOne(cartObj).then(()=>{
                res.redirect('/cart')
            })
        }
        }
        catch(err){
            next(err)
        }
       
    },
    changeProductQuantity:async(req,res,next)=>{

        try{
            let details = req.body
        
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        let index=details.index
        var key="products."+index+".quantity"
        console.log("size",index);
        
        if(details.count==-1&&details.quantity==1){
            cartCollection.updateOne({_id:ObjectId(details.cartId)},{
                    $pull:{products:{item:ObjectId(details.proId),size:details.size}}
            }).then((response)=>{
                console.log(response);
                response.delete=true
                res.json(response)
            })


        }else{
            
            cartCollection.updateOne({_id:ObjectId(details.cartId),'products.item':ObjectId(details.proId),'products.size':details.size},
            {
                $inc:{[key]:details.count}
            }).then(async()=>{
                let response={status:true}
                let cartCount=await CartCount(req.session.user._id)
                let total=await getCartTotal(req.session.user._id)
                if(cartCount>0){
                    let savings=total.total-total.disTotal
                    response.total=total
                    response.disc=Math.floor((savings*100)/total.total)
                  }
                res.json(response)
            })
        }
        }
        catch(err){
            next(err)
        }
    },
    removeCartProduct:(req,res)=>{
        try{
            let details=req.body
        cartCollection.updateOne({_id:ObjectId(details.cart)},
            {
                $pull:{products:{item:ObjectId(details.product),size:details.size}}
            }).then((response)=>{
                res.json({removeProduct:true})
            })
        }
        catch(err){
            next(err)
        }
    }
}