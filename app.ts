import { Cors } from './config/corsOptions';
const express=require('express');
const cors=require('cors');
const bodyParser=require('body-parser');
const path=require('path');
const allowedOrigins=require('./config/allowedOrigins.json')
require('dotenv').config();
export class App{
    private cors:Cors
    private port:number
    public app:any=express();
   public constructor(port:number,){
        //MiddleWare
        this.cors=new Cors(allowedOrigins.allowedOrigins)
        this.port=port;
        this.app.use(cors(this.cors.corsOption));
        this.app.use(bodyParser.urlencoded({extended:false}));
        this.app.use(bodyParser.json());



    }
    public serverCreate():void{
        this.app.listen(this.port,()=>{
            console.log("Server created at port: "+this.port);
            console.log("Server listenting at localhost:"+this.port)
        });
    }
    
}
