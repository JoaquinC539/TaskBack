"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const express = require('express');
const controller_1 = require("../controllers/controller");
const tokenVerify = require('../middleware/tokenVerify');
const refreshTokenVerify = require('../middleware/refreshTokenVerify');
const controller = new controller_1.Controller();
class Router {
    constructor() {
        this.routes = express.Router();
        this.routes.get('', controller.view);
        this.routes.post('/team', controller.newTeam);
        this.routes.post('/admin', controller.newAdminUser);
        this.routes.get('/team/:id', controller.getTeam);
        this.routes.post('/login', controller.login);
        this.routes.get('/jwtTest', tokenVerify, controller.protectedMethod);
        this.routes.get('/refresh', refreshTokenVerify, controller.refreshToken);
    }
}
exports.Router = Router;
