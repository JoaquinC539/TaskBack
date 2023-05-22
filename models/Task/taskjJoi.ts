import Joi from "joi";
const validRoles=["employee","supervisor","aadmin"]
export const taskJoi=Joi.object({
    title:Joi.string().min(4).max(120).required(),
    userId:Joi.string().min(24).max(24).required(),
    type:Joi.string().min(4).required(),
    description:Joi.string().min(4).max(500).required(),
    comment:Joi.string(),
    department:Joi.string().min(2).max(25),
    roleType:Joi.string().min(2).max(25)
});