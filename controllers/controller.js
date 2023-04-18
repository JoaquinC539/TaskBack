"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
class Controller {
    constructor() { }
    view(req, res) {
        res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
    }
    newTeam(req, res) {
    }
}
exports.Controller = Controller;
