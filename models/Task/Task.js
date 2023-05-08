"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const taskSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
        min: 5,
        max: 50
    },
    senderName: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    roleType: {
        type: String,
        required: true,
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
    },
    teamId: {
        type: String,
        required: true
    },
});
module.exports = mongoose_1.default.model('Task', taskSchema);
