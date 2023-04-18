import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        min:5,
        max:100
    },
    password:{
        type:String,
        required:true,
        min:10
    },
    teamID:{
        type:Number,
        required:true,
    },
    role:{
        type:String,
        required:true
    },

    date:{
        type:Date,
        default:Date.now
    }

})
module.exports=mongoose.model('User',userSchema);