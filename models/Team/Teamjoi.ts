import Joi from "joi";

const teamRegisterSchema=Joi.object({
    name:Joi.string().min(5).max(35).required()
});

module.exports=teamRegisterSchema