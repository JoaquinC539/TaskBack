"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyRefreshToken = (req, res, next) => {
    const cookies = req.cookies.jwt;
    if (!cookies) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const verified = jsonwebtoken_1.default.verify(cookies, process.env.REFRESH_TOKEN);
        req.user = verified;
        next();
    }
    catch (error) {
        res.status(400).json({ error: "Authorization rejected", description: error });
    }
};
module.exports = verifyRefreshToken;
