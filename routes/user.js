var express = require('express');
var router = express.Router();

const nocache = require('nocache');

const userController=require('../controller/userController')
const productController=require('../controller/productController');
const cartController = require('../controller/cartController');
const orderController=require('../controller/orderController')
/* GET home page. */

let verifyLogin = (req, res, next) => {
  let user = req.session.user
  if (user) {
    next()
  } else {
    res.redirect('/login')
  }
}

router.get('/', nocache(),userController.homePage);

router.get('/signup', nocache(),userController.userSignup)
router.post("/signup", userController.userSignupSubmit)

router.get('/login', nocache(),userController.userLogin)
router.post('/login',userController.userLoginPost)

router.get('/logout',nocache(),userController.userLogout)
router.get('/otp-login', nocache(), userController.otpLogin)

router.post('/sent-otp',userController.sendOTP)

router.post('/otp-login',userController.otpLoginPost)

router.get('/shop',productController.shop)

router.get('/product/:id',productController.singleProduct)

router.get('/cart',verifyLogin,cartController.cart)

router.post('/add-to-cart/:id', verifyLogin,cartController.addToCart)

router.post('/change-quantity',verifyLogin,cartController.changeProductQuantity)

router.post('/remove-cart-product',verifyLogin,cartController.removeCartProduct)

router.get('/place-order',verifyLogin,nocache(),orderController.placeOrder)

router.get('/place-order-success-page',orderController.successOrder)

router.post('/place-order',nocache(),orderController.placeOrderPost)

router.post('/verify-payment',orderController.verifyPayment)

router.get('/orders',verifyLogin,orderController.viewOrders)

router.get('/orderItem/:orderId/:proId/:index',verifyLogin,orderController.singleOrder)

router.get('/profile',verifyLogin,userController.userProfile)

router.post('/update-user-data',userController.updateUserData)

router.get('/Change-password',verifyLogin,userController.changePassword)

router.post('/verify-password',userController.verifyPassword)

router.post('/change-password',userController.changePasswordPost)


router.get('/address-manage',verifyLogin,userController.getUserAddress)

router.get('/add-address/:id',verifyLogin,userController.addAddress)

router.post('/add-address/:id',verifyLogin,userController.addUserAddress)

router.get('/delete-address/:index/:id',verifyLogin,userController.deleteAddress)

router.get('/cancel-order/:id([0-9a-fA-F]{24})',verifyLogin,orderController.cancelOrderProducts)

router.post('/cancel-order/:id',verifyLogin,orderController.cancelOrderPost)

router.get('/place-order/select-address/:id',verifyLogin,userController.selectUserAddress)

router.get('/selected-address/:id',verifyLogin,userController.showSelectedAddress)

module.exports = router;   
 