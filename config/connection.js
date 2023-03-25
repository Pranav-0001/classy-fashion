const mongoose=require('mongoose')
require('dotenv').config()

mongoose.set('strictQuery',false)
const URL="mongodb+srv://"+process.env.MONGO_EMAIL+":"+process.env.MONGO_PASS+"@classy.w2cl37s.mongodb.net/classy?retryWrites=true&w=majority"
mongoose.connect(URL).then((data)=>{
    console.log("Connection Success");
})

