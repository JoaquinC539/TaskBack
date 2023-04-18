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
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const TeamModel = require('../models/Team/Team');
const teamJoi = require('../models/Team/Teamjoi');
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
                console.log(error);
                res.status(500).json({ error: "An error ocurred", description: error });
            }
        });
    }
}
exports.Controller = Controller;
