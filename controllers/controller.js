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
const Error = mongoose.Error;
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
     * @param req name: User name, password: Password used to get access to the team, teamId: Id of a team to be linked the new team
     * @param res json with new user containing name, hashed password, teamId and admin and department "director" role by default
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
                    role: "admin",
                    department: "direction"
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
     * @param res Authorization token inside a json and a cookie with refresh token embedded name, role, department, teamId and _id
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
                    teamId: user.teamId,
                    department: user.department
                }, process.env.TOKEN, { expiresIn: process.env.EXPIRE_TOKEN });
                const refreshToken = jwt.sign({
                    name: user.name,
                    _id: user._id,
                    role: user.role,
                    teamId: user.teamId,
                    department: user.department
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
                teamId: user.teamId,
                department: user.department
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
                if (req.query.department) {
                    query.department = req.query.department;
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
     * @param req body: name, password, role and department role values: "admin", "supervisor", "employee", and any department set by the team
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
                // const teamId=new mongoose.Types.ObjectId(req.user.teamId);
                // const team=await TeamModel.findById(teamId);
                // if(!team || team==null){return res.status(404).json({error:"Team not found"})}
                const salt = yield bcrypt.genSalt(10);
                const hashedPassword = yield bcrypt.hash(String(req.body.password), salt);
                const user = yield new userModel({
                    name: req.body.name,
                    password: hashedPassword,
                    department: req.body.department,
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
     * Updates user role, password, name and/or role, note: employee  and supervisor can't modify their role or department just admins. To modify name and password only can be done by the user itself
     * @param req data of fields to be changed [name, password, role, department] and user _id
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
                if (req.body.teamId) {
                    return res.status(402).json({ error: "Not allowed to change a user teamId" });
                }
                if (!req.body._id) {
                    return res.status(400).json({ error: "Not id provided " });
                }
                if (req.body._id.length !== 24) {
                    return res.status(400).json({ error: "Bad id provided" });
                }
                if (typeof req.body._id !== "string") {
                    return res.status(400).json({ error: "Bad request" });
                }
                if (req.body._id && req.user._id == req.body._id) {
                    personalUpdate = true;
                }
                if (req.user.role === "admin") {
                    roleUpdate = true;
                }
                if (!personalUpdate && req.body.name || !personalUpdate && req.body.password) {
                    return res.status(403).json({ Unauthorized: "Not allowed to edit names and personal information of others" });
                }
                if (!roleUpdate && (req.body.role || req.body.department)) {
                    return res.status(403).json({ Unauthorized: "Not allowed to modify your or others roles or departments. Ask and admin to do that" });
                }
                const targetId = yield new mongoose.Types.ObjectId(String(req.body._id));
                const userQuery = yield userModel.find({ _id: targetId, teamId: req.user.teamId });
                if (!userQuery || userQuery === null || userQuery === undefined || !userQuery.length) {
                    return res.status(404).json({ error: "User not found" });
                }
                if (userQuery[0].teamId !== req.user.teamId) {
                    return res.status(403).json({ error: "Not allowed to modified another teams" });
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
                if (roleUpdate && (req.body.role || req.body.department)) {
                    if ((req.body.role == "admin" || req.body.role == "supervisor" || req.body.role == "employee")) {
                        user.role = req.body.role;
                    }
                    if (req.body.department) {
                        user.department = req.body.department;
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
     * @param req _id:24 length string body form/json or query ?_id={id}
     * @param res error or status 200 operation
     * @returns void
     */
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let targetId;
                if (!req.body._id || !req.body._id || req.body._id === null || req.body._id === undefined) {
                    if (!req.query._id || req.query._id === null || req.query._id === undefined) {
                        return res.status(400).json({ error: "Not id provided or error in request" });
                    }
                    else {
                        targetId = req.query._id;
                    }
                }
                else {
                    targetId = req.body._id;
                }
                if (req.user.role !== "admin") {
                    return res.status(402).json({ Unauthorized: "Just an admin role can perform this action" });
                }
                if (targetId.length != 24 || !targetId) {
                    return res.status(400).json({ Error: "Error in id or not valid" });
                }
                let validId = yield mongoose.Types.ObjectId.isValid(targetId);
                if (validId) {
                    targetId = req.body._id ? req.body._id : req.query._id;
                }
                else {
                    targetId = yield new mongoose.Types.ObjectId(String(req.body._id));
                }
                const userToDelete = yield userModel.find({ _id: targetId, teamId: req.user.teamId });
                if (!userToDelete || userToDelete === null || userToDelete === undefined || !userToDelete.length) {
                    return res.status(200).json({ error: "User to delete not found" });
                }
                if (userToDelete[0].teamId !== req.user.teamId) {
                    return res.status(401).json({ Unauthorized: "Can't modify other teams" });
                }
                yield userModel.deleteOne({ _id: targetId })
                    .then((response) => { })
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
     * Assign new task to somebody, admin can assign tasks to himself and other admins, supervisors and employees. Supervisor can assign task to himself and employees of same department. Employees can't.
     * Supervisors can only assign their own department tasks, while, admins can assign to any department.
     * @param req title, userId, type, description, department (optional, will be user asgined department by default) only admins, roleType (optional, will be user asigned role by default) only admins, and optional comment
     * @param res saved new task with assigned role of the selected user of the task.
     */
    newTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = taskjJoi_1.taskJoi.validate(req.body);
            if (error) {
                return res.status(401).json({ error: "Error in task creation check the error", description: error.details[0].message });
            }
            if (req.user.role === "employee") {
                return res.status(401).json({ Unauthorized: "Not authorized, only admins or supervisors can asign new tasks" });
            }
            let targetUser = yield userModel.find({ teamId: req.user.teamId, _id: req.body.userId }).exec();
            if (!targetUser || targetUser == null || targetUser == undefined || !targetUser.length) {
                return res.status(404).json({ error: "Employee not found" });
            }
            if (targetUser[0].role == "admin" && req.user.role !== "admin") {
                return res.status(402).json({ error: "Only admin can assign task to admin" });
            }
            if (targetUser[0].role == "supervisor" && targetUser[0]._id.toString() !== req.user._id && req.user.role !== "admin") {
                return res.status(402).json({ error: "Cant assign tasks to other supervisors except self" });
            }
            if (targetUser[0].department !== req.user.department && req.user.role !== "admin") {
                return res.status(402).json({ error: "Supervisors can only asign task to employees of the same department" });
            }
            if (req.user.role === "supervsior" && (req.body.roleType === "admin")) {
                return res.status(402).json({ error: "A supervisor can't assign admin type role tasks" });
            }
            let department = targetUser[0].department;
            let roleType = targetUser[0].role;
            if (req.user.role === "admin" && (req.body.roleType || req.body.department)) {
                if (req.body.department) {
                    department = req.body.department;
                }
                if (req.body.roleType) {
                    if (req.body.roleType !== "admin" || req.body.roleType !== "supervisor" || req.body.roleType !== "employee") {
                        return res.status(404).json({ error: "Role type not valid. Valid role types: admin, supervisor and employee" });
                    }
                    roleType = req.body.roleType;
                }
            }
            else if (req.user.role !== "admin" && (req.body.roleType || req.body.department)) {
                return res.status(401).json({ error: "Only admins can assign a different department or role type task"
                });
            }
            try {
                const task = new taskModel({
                    teamId: req.user.teamId,
                    title: req.body.title,
                    senderName: req.user.name,
                    userId: req.body.userId,
                    type: req.body.type,
                    roleType: roleType,
                    description: req.body.description,
                    department: department,
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
    /**
     * Query task from the DB using role permissions, employees can only retreat their own taks, supervisor can see employees and self tasks, admins can query all the data from every person in the team
     * @param req query params: multiple userId, _id,name,title, completion,senderName,comment,type,assignment and department
     * @param res query data or error if not authorized or according data
     *
     */
    getTasks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = {};
                query.teamId = req.user.teamId;
                if (req.user.role === "employee") {
                    query.userId = req.user._id;
                }
                if (req.user.role === "supervisor") {
                    let queriedEmployee = yield userModel.find({ teamId: req.user.teamId, role: "employee", department: req.user.department }).exec();
                    const employeesIds = queriedEmployee.map((employee) => employee._id.toString());
                    employeesIds.push(req.user._id.toString());
                    if (req.query.userId) {
                        let queryUserIds = (req.query.userId.split(","));
                        if (employeesIds.some((id) => queryUserIds.includes(id))) {
                            query.userId = { $in: queryUserIds };
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
                        let queryUserIds = (req.query.userId.split(","));
                        query.userId = { $in: queryUserIds };
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
                if (req.query.department) {
                    query.department = req.query.department;
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
    } /**
     * Edit a Task, credentials role not required to edit a task
     * @param req _id task id, and/or title, type, description, completion, and comment || Can't be updated:  teamId, senderName, assignment (date), userId, roleType and department (Admin exception).
     * @param res success or error json
     */
    updateTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            function buildObject(role = "employee") {
                let update = {};
                if (req.body.title) {
                    update.title = req.body.title;
                }
                if (req.body.type) {
                    update.type = req.body.type;
                }
                if (req.body.description) {
                    update.description = req.body.description;
                }
                if (req.body.completion) {
                    update.completion = req.body.completion;
                }
                if (req.body.comment) {
                    update.comment = req.body.comment;
                }
                if (role === "admin") {
                    if (req.body.roleType) {
                        update.roleType = req.body.roleType;
                    }
                    if (req.body.senderName) {
                        update.senderName = req.body.senderName;
                    }
                    if (req.body.userId) {
                        update.senderName = req.body.userId;
                    }
                    if (req.body.department) {
                        update.department = req.body.department;
                    }
                }
                return update;
            }
            if (req.body.teamId) {
                return res.status(403).json({ forbidden: "Can't change task of teamId" });
            }
            if (!req.body._id) {
                return res.status(400).json({ error: "No Task Id provided (_id)" });
            }
            if (req.body._id.length !== 24 && req.query._id.length !== 24) {
                return res.status(400).json({ error: "Bad task id request" });
            }
            if ((req.body.senderName || req.body.assignment || req.body.userId || req.body.roleType || req.body.department) && req.user.role !== "admin") {
                return res.status(403).json({ forbidden: "Can't change sender, assign date, userId or roleType task" });
            }
            try {
                const taskId = yield new mongoose.Types.ObjectId(String(req.body._id));
                const employeeTask = yield taskModel.find({ _id: req.body._id, teamId: req.user.teamId });
                if (!employeeTask || employeeTask == null || employeeTask === undefined) {
                    return res.status(404).json({ error: "Task not found" });
                }
                yield taskModel.findOneAndUpdate({ _id: taskId, teamId: req.user.teamId }, buildObject(req.user.role)).exec();
                return yield res.json({ update: "success" });
            }
            catch (error) {
                return res.status(500).json({ error: error });
            }
        });
    }
    /**
     * Delete a task according to parameters and role.
     * Admin can delete every task without restriction under the same team.
     * Supervisor can only delete it's own tasks asigned by itself or admins and employees asigned to their own department
     * Employees can't delete any task
     * @param req _id
     * @param res success message or error
     *
     */
    deleteTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((!req.body._id || req.body._id.length !== 24) && typeof req.body._id !== "string") {
                res.status(402).json({});
            }
            if (req.user.role === "employee") {
                res.status(402).json({ error: "Not authorized to perform this action" });
            }
            else if (req.user.role === "supervisor") {
                const _id = new mongoose.Types.ObjectId(String(req.body._id));
                let task = yield taskModel.findById(_id).exec();
                if (task.department !== req.user.department) {
                    return res.status(402).json({ error: "Employee task is not on the same department" });
                }
                if (!task || task === null || task === undefined) {
                    return res.status(404).json({ error: "Task not found" });
                }
                if ((task.roleType === "employee" || (task.roleType === "supervisor" && task.userId === String(req.user._id)))) {
                    yield taskModel.deleteOne({ _id: _id, teamId: req.user.teamId })
                        .then((response) => res.status(200).json({ message: "Task deleted", response: response }))
                        .catch((error) => res.status(500).json({ error: error }));
                }
                else {
                    return res.status(402).json({ error: "Not allowed to modify other supervisors or admin tasks" });
                }
            }
            else if (req.user.role === "admin") {
                const _id = new mongoose.Types.ObjectId(String(req.body._id));
                let task = yield taskModel.findById(_id).exec();
                if (!task || task === null || task === undefined) {
                    return res.status(404).json({ error: "Task not found" });
                }
                yield taskModel.deleteOne({ _id: _id, teamId: req.user.teamId })
                    .then((response) => res.status(200).json({ message: "Task deleted", response: response }))
                    .catch((error) => res.status(500).json({ error: error }));
            }
        });
    }
    /**
     * Only edit team name
     * @param req _id,name
     * @param res
     */
    editTeam(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== "admin") {
                return res.status(402).json({ error: "Only admin can change team name" });
            }
            if (req.user.department !== "direction") {
                return res.status(402).json({ error: "Only admin in direction role can change team name" });
            }
            if (!req.body.name || req.body.name === null || req.body.name === undefined) {
                return res.status(400).json({ error: "Team name not valid" });
            }
            try {
                const team = yield TeamModel.findById(req.user.teamId);
                if (team && team !== null && team !== undefined) {
                    TeamModel.findOneAndUpdate({ _id: req.body.teamId, name: req.body.name });
                    return res.status(201).json({ response: "Team name updated to: " + String(req.body.name) });
                }
                else {
                    return res.status(404).json({ error: "Team not found" });
                }
            }
            catch (error) {
                console.log(error);
                return res.status(500).json({ error: "Server Error", body: error });
            }
        });
    }
    deleteTeam(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== "admin" && req.user.department !== "direction") {
                return res.status(402).json({ error: "Not allowed to delete a team" });
            }
            let team = yield TeamModel.findById(req.user.teamId);
            if (!team || team === null || team === undefined) {
                return res.status(404).json({ error: "Team not found" });
            }
            yield taskModel.deleteMany({ teamId: req.user.teamId });
            yield userModel.deleteMany({ teamId: req.user.teamId });
            yield TeamModel.deleteOne({ _id: req.user.teamId });
            return res.status(201).json({ message: "Team. task and users were deleted" });
        });
    }
}
exports.Controller = Controller;
