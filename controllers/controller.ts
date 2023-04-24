import { string } from "joi";

const mongoose=require('mongoose');
const path=require('path');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const TeamModel=require('../models/Team/Team');
const teamJoi=require('../models/Team/Teamjoi');
const userJoi=require('../models/User/Userjoi');
const userModel=require('../models/User/User');
const adminJoi=require('../models/User/AdminJoi');

export class Controller{

    constructor(){}
    view(req:any,res:any){
        res.sendFile(path.join(__dirname,'..','views','index.html'));
    }
    async newTeam(req:any,res:any){
            const {error}=teamJoi.validate(req.body);
            if(error){return res.status(400).json({error:"Error in team creation check the error",description:error.details[0].message})}         
            try {
            const team=new TeamModel({
                    name:req.body.name
             });  
             await team.save()
             .then(res.status(200).json(team))
             .catch((err:any)=>{res.status(500).json({error:err})});
        } catch (error) {
            res.status(500).json({error:"An error ocurred",description:error});
        }        
    }
    async newAdminUser(req:any,res:any){
        const {error} =adminJoi.validate(req.body);      
        if(error){return res.status(400).json({error:"Error in team creation check the error",description:error.details[0].message})}         
        if((req.body.teamId).length!==24){return res.status(409).json({error:"Bad Id, check the id and try again"})}
        try {
        const teamId=new mongoose.Types.ObjectId(req.body.teamId);
        const team=await TeamModel.findById(teamId);
        if(!team || team==null){return res.status(404).json({error:"Team not found"})}
        const duplicate=await userModel.findOne({teamId:req.body.teamId});
        if(duplicate){return res.status(409).json({error:"There is already an admin user, ask an admin to set up another admin"})}
            const salt=await bcrypt.genSalt(10);
            const hashedPassword=await bcrypt.hash(req.body.password,salt)
            const user=await new userModel({
                name:req.body.name,
                password:hashedPassword,
                teamId:req.body.teamId,
                role:"admin"
            });
          await user.save()
          .then(res.status(200).json(user))
          .catch((error:any)=>{return res.status(500).json({error:"An error ocurred",description:error})});
        } catch (error) {
            return res.status(500).json({error:"An error ocurred",description:error});
        }
    }
    async getTeam(req:any,res:any){
        if((req.params.id).length!==24){return res.status(409).json({error:"Bad Id, check the id and try again"})}
        try {
            const id=new mongoose.Types.ObjectId(req.params.id)
            TeamModel.findById(id).exec()
            .then((response:any)=>{res.json(response)})
            .catch((err:any)=>{res.json(err)});

        } catch (error) {
            return res.status(500).send(error);
        }        
    }
    async login(req:any,res:any){
        try{
            const user=await userModel.findOne({name:req.body.name});
            if(!user || user===null || user==undefined){return res.status(404).json({error:"User not found"})}
            const password:string=await bcrypt.compare(req.body.password,user.password);
            if(!password || password===null || password===undefined){ return res.status(401).json({error:"Invalid or incorrect password"})}
            const token=jwt.sign({
                name:user.name,
                _id:user._id,
                role:user.role,
                teamId:user.teamId
            },process.env.TOKEN as string,{expiresIn:process.env.EXPIRE_TOKEN as string});
            const refreshToken=jwt.sign({
                name:user.name,
                _id:user._id,
                role:user.role,
                teamId:user.teamId
            },process.env.REFRESH_TOKEN as string,{expiresIn:process.env.EXPIRE_RTOKEN as string});
            res.cookie('jwt',refreshToken,{
                httpOnly:true,
                secure:true,
                sameSite:'None',
                maxAge:2*24*60*60*1000
            });
           return res.header('Authorization',"Bearer "+token).json({
            error:null,
            data:{token:"Bearer "+token},
           });
        }catch(error){
            res.status(500).json({error:"Internal Server error",description:error});
        }
    }
   async protectedMethod(req:any,res:any){
    return res.json({
        message:"Verified"
    });
   }
   async refreshToken(req:any,res:any){
    const user=await req.user;
    const token=await jwt.sign({
        name:user.name,
        _id:user._id,
        role:user.role,
        teamId:user.teamId
    },process.env.TOKEN as string,{expiresIn:process.env.EXPIRE_TOKEN as string});
    return res.header('Authorization',"Bearer "+token).json({
        error:null,
        data:{token:"Bearer "+token},
       });
   } 

   async getUser(req:any,res:any){   
    try {
        type User={
            teamId:string,
            name:string,
            role:string,
            _id:string
        }
        const query={} as User
        query.teamId=req.user.teamId;
        if(req.query.name){
            query.name=req.query.name;
        }
        if(req.query._id){
            query._id=req.query._id
        }
        if(req.query.role){
            query.role=req.query.role
        }
    

        
            await userModel.find(query).exec()
            .then((response:any)=>{return res.status(200).json(response)})
            .catch((err:any)=>{return res.status(500).json(err)})
         
    } catch (error) {
        return res.status(500).json({error})
    }
    
    
   }
   async newUser(req:any,res:any){

    res.json({message:"working"});
   }
}


