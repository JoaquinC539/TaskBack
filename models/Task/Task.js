"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const taskSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        min: 5,
        max: 50
    },
    userID: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        min: 3,
        max: 25
    },
    description: {
        type: String,
        required: true,
        min: 10,
        max: 355
    },
    completion: {
        type: Boolean,
        required: true,
        date: Date.now
    },
    comment: {
        type: String,
        required: false,
        min: 0,
        max: 255
    },
    assignment: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose_1.default.model('Task', taskSchema);
