const express=require('express');
import { Controller } from "../controllers/controller";
const tokenVerify=require('../middleware/tokenVerify');
const refreshTokenVerify=require('../middleware/refreshTokenVerify');
const controller=new Controller();
export class Router{
    public routes=express.Router();
    constructor(){
        this.routes.get('',controller.view);
        this.routes.post('/team',controller.newTeam);//Correct
        this.routes.post('/admin',controller.newAdminUser); //Correct
        this.routes.get('/team/:id',controller.getTeam); //Correct
        this.routes.post('/login',controller.login); //Correct
        this.routes.get('/refresh',refreshTokenVerify,controller.refreshToken); //Correct
        this.routes.get('/user',tokenVerify,controller.getUser);//Correct
        this.routes.post('/user',tokenVerify,controller.newUser);//Correct
        this.routes.put('/user',tokenVerify,controller.editUser);//Correct
        this.routes.delete('/user',tokenVerify,controller.deleteUser)//Correct;
        this.routes.post('/task',tokenVerify,controller.newTask);//Correct;
        this.routes.get('/task',tokenVerify,controller.getTasks);
        this.routes.put('/task',tokenVerify,controller.updateTask);
        this.routes.delete('/task',tokenVerify,controller.deleteTask);
        this.routes.put('/team',tokenVerify,controller.editTeam);
        this.routes.delete('/team',tokenVerify,controller.deleteTeam);

    }
}