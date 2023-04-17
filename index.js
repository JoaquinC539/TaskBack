"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const app_1 = require("./app");
const dbCon_1 = require("./config/dbCon");
const dbConnection = new dbCon_1.DBCon();
const app = new app_1.App(Number(process.env.PORT) || 3500);
dbConnection.connectDB(String(process.env.DB_URI))
    .then(() => { app.serverCreate(); });
