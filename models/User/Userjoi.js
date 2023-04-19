"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const userJoi = joi_1.default.object({
    name: joi_1.default.string().min(4).max(100).required(),
    password: joi_1.default.string().min(7).max(30).required(),
    teamId: joi_1.default.string().min(24).max(24).required(),
    role: joi_1.default.string().required()
});
module.exports = userJoi;
