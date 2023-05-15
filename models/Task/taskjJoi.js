"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskJoi = void 0;
const joi_1 = __importDefault(require("joi"));
const validRoles = ["employee", "supervisor", "aadmin"];
exports.taskJoi = joi_1.default.object({
    title: joi_1.default.string().min(4).max(120).required(),
    userId: joi_1.default.string().min(24).max(24).required(),
    type: joi_1.default.string().min(4).required(),
    description: joi_1.default.string().min(4).max(500).required(),
    comment: joi_1.default.string(),
    department: joi_1.default.string().min(2).max(25),
    roleType: joi_1.default.string().min(2).max(25)
});
