"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const userJoi = joi_1.default.object({
    name: joi_1.default.string().min(4).max(100).required(),
    password: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.number()).required(),
    teamId: joi_1.default.string().required(),
    department: joi_1.default.string()
});
module.exports = userJoi;
