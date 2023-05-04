const express=require('express');
import { Controller } from "../controllers/controller";
const tokenVerify=require('../middleware/tokenVerify');
const refreshTokenVerify=require('../middleware/refreshTokenVerify');
const controller=new Controller();
export class Router{
    public routes=express.Router();
    constructor(){
        this.routes.get('',controller.view);
        this.routes.post('/team',controller.newTeam);
        this.routes.post('/admin',controller.newAdminUser);
        this.routes.get('/team/:id',controller.getTeam);
        this.routes.post('/login',controller.login);
        this.routes.get('/refresh',refreshTokenVerify,controller.refreshToken);
        this.routes.get('/user',tokenVerify,controller.getUser);
        this.routes.post('/user',tokenVerify,controller.newUser);
        this.routes.put('/user',tokenVerify,controller.editUser);
        this.routes.delete('/user',tokenVerify,controller.deleteUser);
        this.routes.post('/task',tokenVerify,controller.newTask);
        this.routes.get('/task',tokenVerify,controller.getTasks);
        this.routes.put('/task',tokenVerify,controller.updateTask)

    }
}