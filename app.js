"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const corsOptions_1 = require("./config/corsOptions");
const routes_1 = require("./routes/routes");
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const allowedOrigins = require('./config/allowedOrigins.json');
const cookieParser = require('cookie-parser');
require('dotenv').config();
class App {
    constructor(port) {
        this.app = express();
        this.router = new routes_1.Router();
        //MiddleWare
        this.cors = new corsOptions_1.Cors(allowedOrigins.allowedOrigins);
        this.port = port;
        this.app.use(cors(this.cors.corsOption));
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        //Routes
        this.app.use('/api', express.static(path.join(__dirname, 'views')));
        this.app.use('/api', this.router.routes);
        this.app.use('*', this.notFound);
    }
    serverCreate() {
        this.app.listen(this.port, () => {
            console.log("Server created at port: " + this.port);
            console.log("Server listenting at localhost:" + this.port);
        });
    }
    notFound(req, res) {
        res.status(404);
        if (req.accepts('html')) {
            res.sendFile(path.join(__dirname, 'views', '404.html'));
        }
        else if (req.accepts('json')) {
            res.status(404).json({ message: "404 Not Found" });
        }
        else {
            res.type('txt').send('404 Not Found');
        }
        ;
    }
}
exports.App = App;
