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
const taskjJoi_1 = require("../models/Task/taskjJoi");
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const TeamModel = require('../models/Team/Team');
const teamJoi = require('../models/Team/Teamjoi');
const userJoi = require('../models/User/Userjoi');
const userModel = require('../models/User/User');
const adminJoi = require('../models/User/AdminJoi');
const taskModel = require('../models/Task/Task');
class Controller {
    constructor() {
    }
    view(req, res) {
        res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
    }
    /**
     *
     * @param req name: Team name to be generated
     * @param res team name and id
     * @returns json response and new team saved into DB
     */
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
    /**
     *
     * @param req name: User name, password: Password used to get access to the teeam, teamId: Id of a team to be linked the new team
     * @param res json with new user containing name, hashed password, teamId and admin role by default
     * @returns status 200 or error and first admin user saved into the DB
     */
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
    /**
     *
     * @param req Get a team by Id using params
     * @param res The team data (id and name)
     * @returns json
     */
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
    /**
     *
     * @param req name: User name already registered, password: access password created previously
     * @param res Authorization token inside a json and a cookie with refresh token
     * @returns json
     */
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userModel.findOne({ name: req.body.name });
                if (!user || user === null || user == undefined) {
                    return res.status(404).json({ error: "User not found" });
                }
                const password = yield bcrypt.compare(String(req.body.password), String(user.password));
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
                return res.status(500).json({ error: "Internal Server error", description: error });
            }
        });
    }
    /**
     *
     * @param req Cookie 'jwt' with refresh token
     * @param res json containing a new shortlived access token
     * @returns json
     */
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
    /**
     * Query function controller for Users inside the team of the user using the team Id signed into the access token.
     * @param req query params including name, role, teamId eg: 'user?name=John Doe
     * @param res object containing all query matched results
     * @returns json
     */
    getUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = {};
                query.teamId = req.user.teamId;
                if (req.query.name) {
                    query.name = req.query.name;
                }
                if (req.query._id) {
                    query._id = req.query._id;
                }
                if (req.query.role) {
                    query.role = req.query.role;
                }
                yield userModel.find(query).exec()
                    .then((response) => { return res.status(200).json(response); })
                    .catch((err) => { return res.status(500).json(err); });
            }
            catch (error) {
                return res.status(500).json({ error });
            }
        });
    }
    /**
     * Create a new user of a team. Only can be created by someone with admin role. Team id is gotten from credentials
     * @param req body: name, password and role token: role, teamId role values: "admin", "supervisor", "employee"
     * @param res json with the new user
     */
    newUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.user.role !== "admin") {
                    return res.status(403).json({ Unauthorized: "Not authorized to create a new user. Only admin roles can do this" });
                }
                if (!req.user) {
                    return res.status(401).json({ error: "Authentication couldn't be solved" });
                }
                if (!req.body) {
                    return res.status(400).json({ error: "There is no body to create a new user" });
                }
                let { error } = userJoi.validate(req.body);
                if (error) {
                    return res.status(400).json(error);
                }
                if (!req.body.role || req.body.role === undefined || req.body.role == null) {
                    return res.status(401).json({ error: "Not role defined" });
                }
                if (req.body.role !== "supervisor" && req.body.role !== "admin" && req.body.role !== "employee") {
                    return res.status(401).json({ error: "Not valid role" });
                }
                const teamId = new mongoose.Types.ObjectId(req.user.teamId);
                const team = yield TeamModel.findById(teamId);
                if (!team || team == null) {
                    return res.status(404).json({ error: "Team not found" });
                }
                const salt = yield bcrypt.genSalt(10);
                const hashedPassword = yield bcrypt.hash(String(req.body.password), salt);
                const user = yield new userModel({
                    name: req.body.name,
                    password: hashedPassword,
                    role: req.body.role,
                    teamId: req.user.teamId
                });
                yield user.save()
                    .then((response) => { return res.status(200).json(response); })
                    .catch((error) => { return res.status(500).json(error); });
            }
            catch (error) {
                console.log(error);
                res.json(error);
            }
        });
    }
    /**
     * Updates user role, password, name and/or role, note: employee  and supervisor can't modify their role just admins. To modify name and password only can be done by the user itself
     * @param req data of fields to be changed and user _id
     * @param res json with new data (hashed password)
     */
    editUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req || req === undefined || req === null) {
                return res.json({ error: "Bad request" });
            }
            if (!req.body || req.body === undefined || req.body === null) {
                return res.json({ error: "Bad request" });
            }
            try {
                let personalUpdate = false;
                let roleUpdate = false;
                if (!req.body._id) {
                    return res.status(400).json({ error: "Not id provided " });
                }
                if (req.body._id.length !== 24) {
                    return res.status(400).json({ error: "Bad id provided" });
                }
                if (typeof req.body._id !== "string") {
                    return res.status(400).json({ error: "Bad request" });
                }
                if (req.body._id)
                    if (req.body._id && req.user._id == req.body._id) {
                        personalUpdate = true;
                    }
                if (req.user.role === "admin") {
                    roleUpdate = true;
                }
                if (!personalUpdate && req.body.name || !personalUpdate && req.body.password) {
                    return res.status(401).json({ Unauthorized: "Not allowed to edit names and personal information of others" });
                }
                if (!roleUpdate && req.body.role) {
                    return res.status(401).json({ Unauthorized: "Not allowed to modify your or others roles. Ask and admin to do that" });
                }
                const targetId = yield new mongoose.Types.ObjectId(String(req.body._id));
                const userQuery = yield userModel.findById(targetId);
                if (!userQuery || userQuery === null || userQuery === undefined) {
                    return res.status(404).json({ error: "User not found" });
                }
                if (userQuery.teamId !== req.user.teamId) {
                    return res.status(402).json({ forbidden: "Not allowed to modified another teams" });
                }
                let user = yield {};
                let response = yield {};
                response.message = null;
                if (req.body.name && personalUpdate) {
                    user.name = req.body.name;
                }
                if (req.body.password && personalUpdate) {
                    const salt = yield bcrypt.genSalt(10);
                    const hashedPassword = yield bcrypt.hash(String(req.body.password), salt);
                    user.password = hashedPassword;
                }
                if (roleUpdate && req.body.role) {
                    if (req.user.role === "admin") {
                        if ((req.body.role == "admin" || req.body.role == "supervisor" || req.body.role == "employee")) {
                            user.role = req.body.role;
                        }
                        else {
                            return res.status(400).json({ error: "Not valid role " });
                        }
                    }
                    else {
                        response.message = "Role is not an admin, role wasn't changed.";
                    }
                }
                yield userModel.findOneAndUpdate({ _id: targetId }, user);
                const queriedUser = yield userModel.findOne({ _id: targetId });
                return res.status(200).json({ user: queriedUser, error: response });
            }
            catch (error) {
                return res.json(error);
            }
        });
    }
    /**
     * Delete one user, only admin role can perform this action
     * @param req _id:24 length string
     * @param res error or status 200 operation
     * @returns void
     */
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body || !req.body._id || req.body._id === null || req.body._id === undefined) {
                    return res.status(400).json({ error: "Not id provided or error in request" });
                }
                if (req.user.role !== "admin") {
                    return res.status(402).json({ Unauthorized: "Just an admin role can perform this action" });
                }
                if (req.body._id.length !== 24) {
                    return res.status(401).json({ Error: "Error in id or not valid" });
                }
                let targetId;
                let validId = yield mongoose.Types.ObjectId.isValid(req.body._id);
                if (validId) {
                    console.log(mongoose.Types.ObjectId.isValid(req.body._id));
                    targetId = req.body._id;
                }
                else {
                    targetId = yield new mongoose.Types.ObjectId(String(req.body._id));
                }
                const userToDelete = yield userModel.findById(targetId);
                if (!userToDelete || userToDelete === null || userToDelete === undefined) {
                    return res.status(200).json({ error: "User to delete not found" });
                }
                if (userToDelete.teamId !== req.user.teamId) {
                    return res.status(401).json({ Unauthorized: "Can't modify other teams" });
                }
                yield userModel.deleteOne({ _id: targetId })
                    .then((response) => { console.log(response); })
                    .catch((error) => console.log(error));
                return res.status(200).json({ message: "Operation succesful" });
            }
            catch (error) {
                console.log(error);
                return res.status(500).json({ error: "An error ocurred" });
            }
        });
    }
    /**
     * Add as new task to somebody, admin can assign tasks to himself and other admins, supervisor and employees. Supervisor can assugn task to himelf and employees. Employees can't
     * @param req title, userId, type, description and optional comment
     * @param res
     */
    newTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = taskjJoi_1.taskJoi.validate(req.body);
            if (error) {
                return res.status(401).json({ error: "Error in task creation check the error", description: error.details[0].message });
            }
            if (req.user.role !== "admin" && req.user.role !== "supervisor") {
                return res.status(402).json({ Unauthorized: "Not authorized, only admin or supervisor can asign new tasks" });
            }
            let targetUser = yield userModel.find({ teamId: req.user.teamId, _id: req.body.userId }).exec();
            if (!targetUser || targetUser == null || targetUser == undefined || !targetUser.length) {
                return res.status(404).json({ error: "Employee not found" });
            }
            if (targetUser[0].role == "admin") {
                return res.status(402).json({ error: "Supervisor can't assign task to admin" });
            }
            if (targetUser[0].role == "supervisor" && targetUser[0]._id.toString() !== req.user._id) {
                return res.status(402).json({ error: "Cant assign tasks to other supervisors except self" });
            }
            try {
                const task = new taskModel({
                    teamId: req.user.teamId,
                    title: req.body.title,
                    senderName: req.user.name,
                    userId: req.body.userId,
                    type: req.body.type,
                    description: req.body.description,
                    completion: false,
                    comment: req.body.comment
                });
                yield task.save()
                    .then((response) => res.status(200).json(response))
                    .catch((error) => res.status(500).json(error));
            }
            catch (error) {
                return res.status(500).json(error);
            }
        });
    }
    getTasks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = {};
                query.teamId = req.user.teamId;
                if (req.user.role === "employee") {
                    query.userId = req.user._id;
                }
                if (req.user.role === "supervisor") {
                    let queriedEmployee = yield userModel.find({ teamId: req.user.teamId, role: "employee" }).exec();
                    const employeesIds = queriedEmployee.map((employee) => employee._id.toString());
                    employeesIds.push(req.user._id.toString());
                    if (req.query.userId) {
                        if (employeesIds.includes(req.query.userId)) {
                            query.userId = req.query.userId;
                        }
                        else {
                            return res.status(404).json({ error: "Employee not found or higher hierarchy tasks not allowed to retreat" });
                        }
                    }
                    else {
                        query.userId = { $in: employeesIds };
                    }
                }
                if (req.user.role === "admin") {
                    if (req.query.userId) {
                        query.userId = req.query.userId;
                    }
                }
                if (req.query.title) {
                    query.title = req.query.title;
                }
                if (req.query.senderName) {
                    query.senderName = req.query.senderName;
                }
                if (req.query.type) {
                    query.type = req.query.type;
                }
                if (req.query.description) {
                    query.description = req.query.description;
                }
                if (req.query.completion) {
                    query.completion = req.query.completion;
                }
                if (req.query.comment) {
                    query.comment = req.query.comment;
                }
                if (req.query.assignment) {
                    query.assignment = req.query.assignment;
                }
                try {
                    yield taskModel.find(query)
                        .then((response) => res.status(200).json(response))
                        .catch((err) => console.log(err));
                    return;
                }
                catch (error) {
                    return res.status(500).json(error);
                }
            }
            catch (error) {
                console.log(error);
                return res.status(500).json(error);
            }
        });
    }
}
exports.Controller = Controller;
