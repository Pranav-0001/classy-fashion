function placeOrder() {
    let fname=document.myForm.fname.value
    let lname=document.myForm.lname.value
    let state=document.myForm.state.value
    let address=document.myForm.address.value
    let pincode=document.myForm.pincode.value
    let town=document.myForm.town.value
    let phone=document.myForm.phone.value
    let email=document.myForm.email.value
    let payment=document.myForm.payment.value
    let save=document.myForm.save.value
    let nameRegx=/^([A-Za-z]){3,20}$/gm
    let lnameRegx=/^([A-Za-z]){1,20}$/gm
    let pinRegx=/^([0-9]){6}$/gm
    let phoneregex=/^([0-9]){10}$/gm
    let EmailRegx=/^(\w){3,16}@([A-Za-z]){5,8}.([A-Za-z]){2,3}$/gm
    if(fname==''){
        document.getElementById('placeOrderErr').innerHTML="Firstname field reqired"
        return false
    }
    else if(nameRegx.test(fname)==false){
        document.getElementById('placeOrderErr').innerHTML="Firstname only allows characters and length should atleast 4 characters"
        return false
    }else if(lname==''){
        document.getElementById('placeOrderErr').innerHTML="Lastname field reqired"
        return false
    }else if(lnameRegx.test(lname)==false){
        document.getElementById('placeOrderErr').innerHTML="lastname only allows characters and length should atleast 4 characters"
        return false
    }else if(state==''){
        document.getElementById('placeOrderErr').innerHTML="Select Your state"
        return false
    }else if(address==''){
        document.getElementById('placeOrderErr').innerHTML="Address field required"
        return false
    }else if(address.length<5){
        document.getElementById('placeOrderErr').innerHTML="Address is too small"
        return false
    }else if(pincode==''){
        document.getElementById('placeOrderErr').innerHTML="Pincode field is empty"
        return false
    }
    else if(pinRegx.test(pincode)==false){
        document.getElementById('placeOrderErr').innerHTML="Invalid Pincode" 
        return false
    }else if(town==''){
        document.getElementById('placeOrderErr').innerHTML="Town field required" 
        return false
    }else if(town.length<5){
        document.getElementById('placeOrderErr').innerHTML="Town name is too small enter a valid town" 
        return false
    }else if(phone==''){
        document.getElementById('placeOrderErr').innerHTML="Phone number field is required" 
        return false
    }else if(email==''){
        document.getElementById('placeOrderErr').innerHTML="Phone number field is required" 
        return false
    }else if(phoneregex.test(phone)==false){
        document.getElementById('placeOrderErr').innerHTML="Invalid Phone Number" 
        return false
    }else if(EmailRegx.test(email)==false){
        document.getElementById('placeOrderErr').innerHTML="Invalid Email address" 
        console.log(email);
        return false
    }

    return true



}
 
function userSignUp(){
    let username=document.signup.username.value
    let phone=document.signup.phone.value
    let email=document.signup.email.value
    let gender=document.signup.gender.value
    let password=document.signup.password.value
    let repassword=document.signup.repassword.value
    let emailRegx = /^(\w){3,16}@([A-Za-z]){5,8}.([A-Za-z]){2,3}$/gm
    let passwordRegx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/gm
    let usernameRegx = /^([A-Za-z_]){4,12}$/gm
    let phoneRegx = /^([0-9]){10}$/gm
    if(username==''){
        document.getElementById('signupErr').innerHTML="Username field required"
        return false
    }else if(usernameRegx.test(username)==false){
        document.getElementById('signupErr').innerHTML="Username can only conatain Letters and _.Should contain atleast 4 letters and max 12"
        return false
    }else if(phone==''){
        document.getElementById('signupErr').innerHTML="Phone number field required"
        return false
    }else if(phoneRegx.test(phone)==false){
        document.getElementById('signupErr').innerHTML="Invalid Phone number"
        return false
    }else if(email==''){
        document.getElementById('signupErr').innerHTML="Email field required"
        return false
    }else if(emailRegx.test(email)==false){
        document.getElementById('signupErr').innerHTML="Invalid email address"
        return false
    }else if(gender==''){
        document.getElementById('signupErr').innerHTML="Gender field required"
        return false
    }else if(password==''){
        document.getElementById('signupErr').innerHTML="Password field required"
        return false
    }else if(passwordRegx.test(password)==false){
        document.getElementById('signupErr').innerHTML="Password Should contain atleast one uppercase ,lowercase and  number"
        return false
    }else if(repassword==''){
        document.getElementById('signupErr').innerHTML="Confirm your password"
        return false
    }else if(password!=repassword){
        document.getElementById('signupErr').innerHTML="Password do not match"
        return false
    }
    return true




}

function userEdit(){
    let username=document.editProfile.username.value
    let phone=document.editProfile.phone.value
    let email=document.editProfile.email.value
    let emailRegx = /^(\w){3,16}@([A-Za-z]){5,8}.([A-Za-z]){2,3}$/gm
    let usernameRegx = /^([A-Za-z_]){4,12}$/gm
    let phoneRegx = /^([0-9]){10}$/gm
    if(username==''){
        document.getElementById('signupErr').innerHTML="Username field required"
        return false
    }else if(usernameRegx.test(username)==false){
        document.getElementById('signupErr').innerHTML="Username can only conatain Letters and _.Should contain atleast 4 letters and max 12"
        return false
    }else if(phone==''){
        document.getElementById('signupErr').innerHTML="Phone number field required"
        return false
    }else if(phoneRegx.test(phone)==false){
        document.getElementById('signupErr').innerHTML="Invalid Phone number"
        return false
    }else if(email==''){
        document.getElementById('signupErr').innerHTML="Email field required"
        return false
    }else if(emailRegx.test(email)==false){
        document.getElementById('signupErr').innerHTML="Invalid email address"
        return false
    }
    return true
}

function addProductValidate(){
    let priceRegx = /^([0-9]){1,6}$/gm
    let proRegx = /^([A-Za-z 0-9]){4,80}$/gm
    let brandRegx = /^([A-Za-z ]){3,12}$/gm
    let discountRegx = /^([0-9]){1,2}$/gm
    let stockRegx = /^([0-9]){1,5}$/gm
    let desRegx = /^([A-Za-z0-9 ,_.-]){5,500}$/gm
    let productData={}
    productData.product=document.addProduct.product.value
    productData.brand = document.addProduct.brand.value
    productData.price= document.addProduct.price.value
    productData.stock =document.addProduct.stock.value
    productData.category=document.addProduct.category.value
    productData.description = document.addProduct.description.value
    productData.discount=document.addProduct.discount.value
    let s=document.addProduct.M.value

    console.log(s);

    if (productData.product == '') {
        document.getElementById('addErrId').innerHTML = "Title field is empty"
        return false
    } else if (productData.brand == '') {
        document.getElementById('addErrId').innerHTML = "Brand filed is empty"
        return false;
    } else if (productData.price == '') {
        document.getElementById('addErrId').innerHTML = "Price field is empty"
        return false;
    } else if (productData.stock == '') {
        document.getElementById('addErrId').innerHTML = "Stock field is empty"
        return false;
    } else if (productData.category == '') {
        document.getElementById('addErrId').innerHTML = "Please choose any category"
        return false;
    } else if (productData.description == '') {
        document.getElementById('addErrId').innerHTML = "Description field is empty"
        return false;
    } else if (brandRegx.test(productData.brand) == false) {
        document.getElementById('addErrId').innerHTML = "Invalid Brand name,Brand name should contain atleast 4 letters"
        return false;
    }
    else if (priceRegx.test(productData.price) == false) {
        document.getElementById('addErrId').innerHTML= "Price field only allows Numbers"
        return false;  
    } else if (discountRegx.test(productData.discount) == false) {
        document.getElementById('addErrId').innerHTML = "discount field only allows Numbers and range should between 0-99"
        return false;
    } else if (stockRegx.test(productData.stock) == false) {
        document.getElementById('addErrId').innerHTML = "Stock field only allows Numbers"
        return false;
    } else if (productData.description.length<10) {
        document.getElementById('addErrId').innerHTML = "Description is too small"
        return false;
    }
    return true
}

function changePass(){
    let pass =document.changePassForm.newpass.value
    let cnfrm=document.changePassForm.confirm.value
    let Err=document.getElementById('verErr')
    let passwordRegx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/gm

    if(pass==''){
        Err.innerHTML="Password field required"
        return false
    }else if(cnfrm==''){
        Err.innerHTML="Confirm your password "
        return false
    }else if(pass!=cnfrm){
        Err.innerHTML="Passwords not matching "
        return false
    }else if(passwordRegx.test(pass)==false){
        Err.innerHTML="Password Should contain atleast one uppercase ,lowercase and  number"
        return false
    }
    return true

}

function addAddressVali(){
    let fname=document.addAddress.fname.value
    let lname=document.addAddress.lname.value
    let state=document.addAddress.state.value
    let address=document.addAddress.address.value
    let pincode=document.addAddress.pincode.value
    let town=document.addAddress.town.value
    let phone=document.addAddress.phone.value
    let email=document.addAddress.email.value 
    let nameRegx=/^([A-Za-z]){3,20}$/gm
    let lnameRegx=/^([A-Za-z]){1,20}$/gm
    let pinRegx=/^([0-9]){6}$/gm
    let phoneregex=/^([0-9]){10}$/gm
    let EmailRegx=/^(\w){3,16}@([A-Za-z]){5,8}.([A-Za-z]){2,3}$/gm

    if(fname==''){
        document.getElementById('placeOrderErr').innerHTML="Firstname field reqired"
        return false
    }
    else if(nameRegx.test(fname)==false){
        document.getElementById('placeOrderErr').innerHTML="Firstname only allows characters and length should atleast 4 characters"
        return false
    }else if(lname==''){
        document.getElementById('placeOrderErr').innerHTML="Lastname field reqired"
        return false
    }else if(lnameRegx.test(lname)==false){
        document.getElementById('placeOrderErr').innerHTML="lastname only allows characters and length should atleast 4 characters"
        return false
    }else if(state==''){
        document.getElementById('placeOrderErr').innerHTML="Select Your state"
        return false
    }else if(address==''){
        document.getElementById('placeOrderErr').innerHTML="Address field required"
        return false
    }else if(address.length<5){
        document.getElementById('placeOrderErr').innerHTML="Address is too small"
        return false
    }else if(pincode==''){
        document.getElementById('placeOrderErr').innerHTML="Pincode field is empty"
        return false
    }
    else if(pinRegx.test(pincode)==false){
        document.getElementById('placeOrderErr').innerHTML="Invalid Pincode" 
        return false
    }else if(town==''){
        document.getElementById('placeOrderErr').innerHTML="Town field required" 
        return false
    }else if(town.length<5){
        document.getElementById('placeOrderErr').innerHTML="Town name is too small enter a valid town" 
        return false
    }else if(phone==''){
        document.getElementById('placeOrderErr').innerHTML="Phone number field is required" 
        return false
    }else if(email==''){
        document.getElementById('placeOrderErr').innerHTML="Phone number field is required" 
        return false
    }else if(phoneregex.test(phone)==false){
        document.getElementById('placeOrderErr').innerHTML="Invalid Phone Number" 
        return false
    }else if(EmailRegx.test(email)==false){
        document.getElementById('placeOrderErr').innerHTML="Invalid Email address" 
        console.log(email);
        return false
    }

    return true
}