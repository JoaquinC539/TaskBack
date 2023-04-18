"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const express = require('express');
const path = require('path');
const controller_1 = require("../controllers/controller");
const controller = new controller_1.Controller();
class Router {
    constructor() {
        this.routes = express.Router();
        this.routes.get('', controller.view);
        this.routes.post('/team', controller.newTeam);
    }
}
exports.Router = Router;
