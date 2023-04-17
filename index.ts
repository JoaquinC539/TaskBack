require('dotenv').config();
import { App } from "./app";
import { DBCon } from "./config/dbCon";
const dbConnection=new DBCon();

const app=new App(Number(process.env.PORT) ||3500);

dbConnection.connectDB(String(process.env.DB_URI))
.then(()=>{app.serverCreate()})







