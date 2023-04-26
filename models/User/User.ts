import mongoose from 'mongoose';

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        min:4,
        max:100
    },
    password:{
        type:String,
        required:true,
        min:7,
        max:255
    },
    teamId:{
        type:String,
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