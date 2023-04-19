import Joi from "joi";

const userJoi=Joi.object({
    name:Joi.string().min(4).max(100).required(),
    password:Joi.string().min(7).max(30).required(),
    teamId:Joi.string().required()
});

module.exports=userJoi