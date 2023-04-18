import { Cors } from './config/corsOptions';
import { Router } from './routes/routes';
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
    private router:Router=new Router();
   public constructor(port:number,){
        //MiddleWare
        this.cors=new Cors(allowedOrigins.allowedOrigins)
        this.port=port;
        this.app.use(cors(this.cors.corsOption));
        this.app.use(bodyParser.urlencoded({extended:false}));
        this.app.use(bodyParser.json());

    //Routes
    this.app.use('/api',express.static(path.join(__dirname,'views')))
    this.app.use('/api',this.router.routes);
    this.app.use('*',this.notFound)
    }
    public serverCreate():void{
        this.app.listen(this.port,()=>{
            console.log("Server created at port: "+this.port);
            console.log("Server listenting at localhost:"+this.port)
        });
    }
    private notFound(req:any,res:any):void{
        res.status(404);
        if(req.accepts('html')){
            res.sendFile(path.join(__dirname,'views','404.html'))
        }else if(req.accepts('json')){
            res.status(404).json({message:"404 Not Found"});
        }else{res.type('txt').send('404 Not Found')};
    }
    
}
