const express=require('express');
const path=require('path');
import { Controller } from "../controllers/controller";
const controller=new Controller();
export class Router{
    public routes=express.Router();
    constructor(){
        this.routes.get('',controller.view);
        this.routes.post('/team',controller.newTeam)
    }
}