var express = require('express');
const nocache = require('nocache');
var router = express.Router();

const uuid=require('uuid');
const { response } = require('express');
const fs=require('fs');

const adminController=require('../controller/adminController')
const productController=require('../controller/productController');

const orderController = require('../controller/orderController');
const { adminAddProduct } = require('../controller/adminController');


/* GET users listing. */
let verifyLogin=(req,res,next)=>{
  let admin=req.session.admin
  if(admin){
    next()
  }else{
    res.redirect('/admin/login')
  }
}
router.get('/',nocache(),verifyLogin,adminController.adminHome)

router.get('/login',nocache(), adminController.adminLogin)
router.post('/login',nocache(),adminController.adminLoginPost)
router.get('/products',verifyLogin,adminController.adminProduct)

router.get('/add-product',verifyLogin,adminController.adminAddProduct)

router.post('/add-product',verifyLogin,adminController.adminAddProductPost)

router.get('/user-list',verifyLogin,adminController.adminUserList)

router.get('/ban-user/:id',verifyLogin,adminController.banUser)

router.get('/unblock-user/:id',verifyLogin,adminController.unblockUser)

router.get('/delete-user/:id',verifyLogin,adminController.deleteUser)

router.get('/delete-product/:id',verifyLogin,productController.deleteProduct)

router.get('/edit-product/:id',verifyLogin,productController.editProduct)

router.post('/edit-product/:id',verifyLogin,productController.editProductPost)

router.get('/categories',verifyLogin,productController.getCategory)

router.post('/add-category',verifyLogin,productController.addCategory)

router.get('/delete-category/:id',verifyLogin,productController.deleteCategory)

router.get('/delete-image/:imgId',verifyLogin,productController.deleteProductImage)

router.get('/add-productImg/:id',verifyLogin,productController.addProductImage)

router.post('/add-productImg/:id',verifyLogin,productController.AddProductImagePost)

router.get('/edit-category/:id',verifyLogin,productController.editCategory)

router.post('/edit-category/:id',verifyLogin,productController.updateCategory)

router.get('/logout',productController.adminLogout)

router.get('/all-orders',verifyLogin,orderController.adminAllOrder)

router.get('/orderdetails/:id([0-9a-fA-F]{24})',verifyLogin,orderController.orderDetails)

router.post('/update-order-status/:id',verifyLogin,orderController.changeOrderStatus)

router.get('/submit-order-request/:set/:id',verifyLogin,orderController.orderCancelRequest)

router.get('/sales-report',verifyLogin,adminController.salesReport)
router.post('/sales-report',verifyLogin,adminController.salesReportPost)

router.get('/coupons',verifyLogin,adminController.couponsGet)

router.get('/add-coupon',verifyLogin,adminController.addCoupon)
router.post('/add-coupon',verifyLogin,adminController.addCouponPost)

router.get('/banner-image',verifyLogin,adminController.bannerImage)

module.exports = router;
  