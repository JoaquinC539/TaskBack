const joi=require('joi');

const teamRegisterSchema=joi.object({
    name:joi.string().min(5).max(35).required()
});

module.exports=teamRegisterSchema