import mongoose from 'mongoose';

const teamSchema=new mongoose.Schema({
    name:{
        type:String,
        min: 5,
        max:35,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    }
});
module.exports=mongoose.model("Team",teamSchema);