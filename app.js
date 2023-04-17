"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const corsOptions_1 = require("./config/corsOptions");
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const allowedOrigins = require('./config/allowedOrigins.json');
require('dotenv').config();
class App {
    constructor(port) {
        this.app = express();
        //MiddleWare
        this.cors = new corsOptions_1.Cors(allowedOrigins.allowedOrigins);
        this.port = port;
        this.app.use(cors(this.cors.corsOption));
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
    }
    serverCreate() {
        this.app.listen(this.port, () => {
            console.log("Server created at port: " + this.port);
            console.log("Server listenting at localhost:" + this.port);
        });
    }
}
exports.App = App;
