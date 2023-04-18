import mongoose from 'mongoose';

const teamSchema=new mongoose.Schema({
    name:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    }
})