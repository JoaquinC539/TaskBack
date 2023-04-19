require('dotenv').config();
import { App } from "./app";
import { DBCon } from "./config/dbCon";
const dbConnection=new DBCon();

const app=new App(Number(process.env.PORT) ||3500);

dbConnection.connectDB(process.env.DB_URI as string)
.then(()=>{app.serverCreate()})
.catch((error)=>console.log(error));







