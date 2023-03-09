const mongoose=require('mongoose')
mongoose.set('strictQuery',false)
const URL="mongodb://127.0.0.1:27017/classy"
mongoose.connect(URL).then((data)=>{
    console.log("Connection Success");
})

