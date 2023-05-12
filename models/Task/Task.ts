import { string } from 'joi';
import mongoose from 'mongoose';



const taskSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        min:5,
        max:50
    },
    senderName:{
        type:String,
        required:true
    },
    userId:{
        type:String,
        required:true
    },
    roleType:{
        type:String,
        required:true,
        
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
        required:true,
        date:Date.now
    },
    comment:{
        type:String,
        required:false,
        min:0,
        max:255
    },
    department:{
        type:String,
        required:true
    },
    assignment:{
        type:Date,
        default:Date.now
    },
    teamId:{
        type:String,
        required:true
    },
    

});

module.exports=mongoose.model('Task',taskSchema);