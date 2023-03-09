const productCollection=require('../model/productModel')
const categoryCollection=require('../model/categoryModel')
const cartCollection=require('../model/cartModel')
const mongoose=require('mongoose')
const {ObjectId}=mongoose.Types
const fs=require('fs');
const uuid=require('uuid')

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
    shop: async(req, res) => {
        let user = req.session.user
        let cartCount = 0
        if (user) {
            let userId = user._id
             cartCount = await CartCount(userId)
        }
        let products=await productCollection.find().toArray()
        let category=await categoryCollection.find().toArray()
        let brands=await productCollection.distinct("brand")
    
        res.render('user/shop', { products, user, category, brands, cartCount })
    },
    singleProduct: async(req,res)=>{
        let user=req.session.user
        let cartCount
        let proId=req.params.id
        if(user){
            cartCount=await CartCount(user._id)
        }
        let product= await productCollection.findOne({_id:ObjectId(proId)})
        
        res.render('user/single-product', { product, user, cartCount })
    },
    deleteProduct:async(req,res)=>{
        let proId=req.params.id
        pro=await productCollection.findOne({_id:ObjectId(proId)})
            let count=pro.Images.length
            for(i=0;i<count;i++){
                fs.unlink('./public/product-images/'+pro.Images[i]+'.jpg',(err)=>{
                    if(err){
                        console.log(err);
                    }
                })
            }
            productCollection.deleteOne({_id:ObjectId(proId)})
            res.redirect('/admin/products')
    },
    editProduct:async(req,res)=>{
        let admin = req.session.admin
        err = req.session.editProductErr
        let id=req.params.id
        delImgErr = req.session.deleteImgErr
        let product=await productCollection.findOne({_id:ObjectId(id)})
        let cate=await categoryCollection.find().toArray()
        res.render('admin/edit-product',{product,err,cate,delImgErr,admin})
    },
    editProductPost:async(req,res)=>{
        let proId = req.params.id
        let productData = req.body
        console.log(productData);
        priceRegx=/^([0-9]){1,6}$/gm
        productRegx=/^([A-Za-z 0-9]){4,80}$/gm
        brandRegx=/^([A-Za-z ]){3,12}$/gm
        discountRegx=/^([0-9]){1,2}$/gm
        stockRegx=/^([0-9]){1,5}$/gm
        desRegx=/^([A-Za-z0-9 ,_.-]){5,500}$/gm
        let response={}
        if(productData.product==''){
            response.err="Title field is empty"
            rreq.session.editProductErr=response.err
            res.redirect('/admin/edit-product/'+req.params.id)
        }else if(productData.brand==''){
            response.err="Brand filed is empty"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }else if(productData.price==''){
            response.err="Price field is empty"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }else if(productData.stock==''){
            response.err="Stock field is empty"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }else if(productData.category==''){
            response.err="Please choose any category"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }else if(productData.description==''){
            response.err="Description field is empty"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }else if(productRegx.test(productData.product)==false){
            response.err="Invalid Product name,Product name should contain atleast 4 letters"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }else if(brandRegx.test(productData.brand)==false){
            response.err="Invalid Brand name,Brand name should contain atleast 4 letters"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }else if(!productData.S && !productData.M && !productData.L && !productData.XL && !productData.XXL){
            response.err="Choose any Size"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }
        else if(priceRegx.test(productData.price)==false){
            response.err="Price field only allows Numbers"
            req.session.editProductErr=response.err
            res.redirect('/admin/edit-product/'+req.params.id)
        }else if(discountRegx.test(productData.discount)==false){
            response.err="discount field only allows Numbers and range should between 0-99"
            req.session.editProductErr=response.err
            res.redirect('/admin/edit-product/'+req.params.id)
        }else if(stockRegx.test(productData.stock)==false){
            response.err="Stock field only allows Numbers"
            req.session.editProductErr=response.err
            res.redirect('/admin/edit-product/'+req.params.id)
        }else if(desRegx.test(productData.description)==false){
            response.err="Description field should contain atleast 5 words"
            req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
        }
        else{

            product=await productCollection.findOne({_id:ObjectId(proId)})
            productData.price = parseInt(productData.price)
            productData.discount = parseInt(productData.discount)
            productData.stock = parseInt(productData.stock)
            let size=[]
            if(productData.S=='on')size.push('S'); else size.push('')
            if(productData.M=='on')size.push('M'); else size.push('')
            if(productData.L=='on')size.push('L'); else size.push('')
            if(productData.XL=='on')size.push('XL'); else size.push('')
            if(productData.XXL=='on')size.push('S'); else size.push('')
            let offer = (productData.price * productData.discount) / 100
            let offerPrice = productData.price - offer
            productData.offerPrice = parseInt(offerPrice)
            productData.savings = parseInt(offer)
            productCollection.updateOne({_id:ObjectId(proId)},{$set:{
                product:productData.product,
                brand:productData.brand,
                price:productData.price,
                discount:productData.discount,
                category:productData.category,
                stock:productData.stock,
                description:productData.description,
                offerPrice:productData.offerPrice,
                savings:productData.savings,
                size:size
            }})
            response.status=true
            response.pro=product
            let Obj=req.files
            if(Obj){
                count=Object.keys(Obj).length
                console.log(count);
                if(response.status){
                  for(i=0;i<count;i++){
                    imgId=Object.keys(Obj)[i]
                    img=Object.values(Obj)[i]
                    img.mv('./public/product-images/'+imgId+'.jpg').then((err)=>{
                      if(err){
                        console.log(err);
                      }
                    })
                  }
                  res.redirect('/admin/products') 
                }else{
                  req.session.editProductErr=response
                  res.redirect('/admin/edit-product/'+req.params.id)
                }
              }else{
                if(response.status){
                  res.redirect('/admin/products') 
                }else{
                  req.session.editProductErr=response.err
                  res.redirect('/admin/edit-product/'+req.params.id)
                }
              }
           
        }
    },
    getCategory:async(req,res)=>{
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
    },
    addCategory:async(req,res)=>{
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
    },
    deleteCategory:async(req,res)=>{
        let cateId=req.params.id
        categoryCollection.deleteOne({_id:ObjectId(cateId)})
        res.redirect('/admin/categories')
    },
    deleteProductImage:async(req,res)=>{
        let imgId=req.params.imgId
        let response={}
        let product = await productCollection.findOne({ Images: { $in: [imgId] } })

        let count = product.Images.length
        console.log(count);
        if (count <= 2) {
            response.msg = "Can't Delete , Minimum 2 Images required"
            response.id = product._id
            req.session.deleteImgErr = response.msg
            let id = response.id
            res.redirect('/admin/edit-product/' + id)
        } else {
            response.id = product._id
            productCollection.updateMany({}, { $pull: { Images: { $in: [imgId] }, Images: imgId } })
            let id=response.id
            res.redirect('/admin/edit-product/' + id)
        }
    },
    addProductImage:async(req,res)=>{
        let err = req.session.addProImageErr
        let admin = req.session.admin
        let proId=req.params.id
        let product=await productCollection.findOne({_id:ObjectId(proId)})
        res.render('admin/add-image',{product,err,admin})
    },
    AddProductImagePost:async(req,res)=>{
        let proId=req.params.id
        let Image=req.files.Image
        let product=await productCollection.findOne({_id:ObjectId(proId)})
            let count=product.Images.length
            let response={}
            if(count>=5){
                response.err="Maximum 5 images are Accepted"
                
                req.session.addProImageErr=response.err
                res.redirect('/admin/add-productImg/'+req.params.id)
            }else{
            let imgId=uuid.v4()
            productCollection.updateOne({_id:ObjectId(proId)},{$push:{Images:imgId}})
            Image.mv('./public/product-images/'+imgId+'.jpg',(err)=>{
                if(err){
                    console.log(err);
                }
            })
            response.status=true
            res.redirect('/admin/products')
            } 
    },
    editCategory:async(req,res)=>{
        let cateId = req.params.id
        let category = await categoryCollection.findOne({ _id: ObjectId(cateId) })
        req.session.editCateData = category
        res.redirect('/admin/categories')
    },
    updateCategory:(req,res)=>{
        let cateId = req.params.id
        let cate = req.body
        let regx = /^(\w)([A-Za-z ]){1,20}/gm
        categoryCollection.updateOne({ _id: ObjectId(cateId) }, { $set: { category: cate.category } })
        res.redirect('/admin/categories')
        
        
    },
    adminLogout:(req,res)=>{
        req.session.admin=null
        res.redirect('/admin/login')
    }

}