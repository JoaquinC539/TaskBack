"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const TeamModel = require('../models/Team/Team');
const teamJoi = require('../models/Team/Teamjoi');
const userJoi = require('../models/User/Userjoi');
const userModel = require('../models/User/User');
const adminJoi = require('../models/User/AdminJoi');
class Controller {
    constructor() { }
    view(req, res) {
        res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
    }
    newTeam(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = teamJoi.validate(req.body);
            if (error) {
                return res.status(400).json({ error: "Error in team creation check the error", description: error.details[0].message });
            }
            try {
                const team = new TeamModel({
                    name: req.body.name
                });
                yield team.save()
                    .then(res.status(200).json(team))
                    .catch((err) => { res.status(500).json({ error: err }); });
            }
            catch (error) {
                res.status(500).json({ error: "An error ocurred", description: error });
            }
        });
    }
    newAdminUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = adminJoi.validate(req.body);
            if (error) {
                return res.status(400).json({ error: "Error in team creation check the error", description: error.details[0].message });
            }
            if ((req.body.teamId).length !== 24) {
                return res.status(409).json({ error: "Bad Id, check the id and try again" });
            }
            try {
                const teamId = new mongoose.Types.ObjectId(req.body.teamId);
                const team = yield TeamModel.findById(teamId);
                if (!team || team == null) {
                    return res.status(404).json({ error: "Team not found" });
                }
                const duplicate = yield userModel.findOne({ teamId: req.body.teamId });
                if (duplicate) {
                    return res.status(409).json({ error: "There is already an admin user, ask an admin to set up another admin" });
                }
                const salt = yield bcrypt.genSalt(10);
                const hashedPassword = yield bcrypt.hash(req.body.password, salt);
                const user = yield new userModel({
                    name: req.body.name,
                    password: hashedPassword,
                    teamId: req.body.teamId,
                    role: "admin"
                });
                yield user.save()
                    .then(res.status(200).json(user))
                    .catch((error) => { return res.status(500).json({ error: "An error ocurred", description: error }); });
            }
            catch (error) {
                return res.status(500).json({ error: "An error ocurred", description: error });
            }
        });
    }
    getTeam(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((req.params.id).length !== 24) {
                return res.status(409).json({ error: "Bad Id, check the id and try again" });
            }
            try {
                const id = new mongoose.Types.ObjectId(req.params.id);
                TeamModel.findById(id).exec()
                    .then((response) => { res.json(response); })
                    .catch((err) => { res.json(err); });
            }
            catch (error) {
                return res.status(500).send(error);
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userModel.findOne({ name: req.body.name });
                if (!user || user === null) {
                    return res.status(404).json({ error: "User not found" });
                }
                const password = yield bcrypt.compare(req.body.password, user.password);
                if (!password || password === null || password === undefined) {
                    return res.status(401).json({ error: "Invalid or incorrect password" });
                }
                const token = jwt.sign({
                    name: user.name,
                    _id: user._id,
                    role: user.role,
                    teamId: user.teamId
                }, process.env.TOKEN, { expiresIn: process.env.EXPIRE_TOKEN });
                const refreshToken = jwt.sign({
                    name: user.name,
                    _id: user._id,
                    role: user.role,
                    teamId: user.teamId
                }, process.env.REFRESH_TOKEN, { expiresIn: process.env.EXPIRE_RTOKEN });
                res.cookie('jwt', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None',
                    maxAge: 2 * 24 * 60 * 60 * 1000
                });
                return res.header('Authorization', "Bearer " + token).json({
                    error: null,
                    data: { token: "Bearer " + token },
                });
            }
            catch (error) {
                res.status(500).json({ error: "Internal Server error", description: error });
            }
        });
    }
    protectedMethod(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            return res.json({
                message: "Verified"
            });
        });
    }
    refreshToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield req.user;
            const token = yield jwt.sign({
                name: user.name,
                _id: user._id,
                role: user.role,
                teamId: user.teamId
            }, process.env.TOKEN, { expiresIn: process.env.EXPIRE_TOKEN });
            return res.header('Authorization', "Bearer " + token).json({
                error: null,
                data: { token: "Bearer " + token },
            });
        });
    }
}
exports.Controller = Controller;
