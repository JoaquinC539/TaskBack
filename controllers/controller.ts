const path=require('path');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

export class Controller{

    constructor(){}
    view(req:any,res:any){
        res.sendFile(path.join(__dirname,'..','views','index.html'));
    }
    newTeam(req:any,res:any){
        
    }
}