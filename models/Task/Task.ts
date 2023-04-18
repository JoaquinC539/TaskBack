import mongoose from 'mongoose';



const taskSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        min:5,
        max:50
    },
    userID:{
        type:Number
    },
    type:{
        type:String,
        required:true,
        min:3,
        max:25
    },
    description:{
        type:String,
        required:true,
        min:10,
        max:355
    },
    completion:{
        type:Boolean,
        date:Date.now
    },
    comment:{
        type:String,
        required:false,
        min:0,
        max:255
    },
    assignment:{
        type:Date,
        default:Date.now
    }

});

module.exports=mongoose.model('Task',taskSchema);