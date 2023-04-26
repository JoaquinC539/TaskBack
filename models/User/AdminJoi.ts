import Joi from "joi";

const userJoi=Joi.object({
    name:Joi.string().min(4).max(100).required(),
    password:Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    teamId:Joi.string().required()
});

module.exports=userJoi