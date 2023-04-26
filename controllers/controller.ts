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
    /**
     * 
     * @param req name: Team name to be generated
     * @param res team name and id
     * @returns json response and new team saved into DB
     */
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
    /**
     * 
     * @param req name: User name, password: Password used to get access to the teeam, teamId: Id of a team to be linked the new team
     * @param res json with new user containing name, hashed password, teamId and admin role by default
     * @returns status 200 or error and first admin user saved into the DB
     */
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
    /**
     * 
     * @param req Get a team by Id using params
     * @param res The team data (id and name)
     * @returns json
     */
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
    /**
     * 
     * @param req name: User name already registered, password: access password created previously
     * @param res Authorization token inside a json and a cookie with refresh token
     * @returns json
     */
    async login(req:any,res:any){
        console.log( req.body);
        try{
            const user=await userModel.findOne({name:req.body.name});
            if(!user || user===null || user==undefined){return res.status(404).json({error:"User not found"})}
            const password:string=await bcrypt.compare(String(req.body.password),String(user.password));
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
           return res.status(500).json({error:"Internal Server error",description:error});
        }
    }

   async protectedMethod(req:any,res:any){
    return res.json({
        message:"Verified"
    });
   }
   /**
    * 
    * @param req Cookie 'jwt' with refresh token
    * @param res json containing a new shortlived access token
    * @returns json
    */
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
   /**
    * Query function controller for Users inside the team of the user using the team Id signed into the access token.
    * @param req query params including name, role, teamId eg: 'user?name=John Doe 
    * @param res object containing all query matched results
    * @returns json
    */
   async getUser(req:any,res:any){   
    try {
        type User={
            teamId:string,
            name:string,
            role:string,
            _id:string,
            password:string
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
   /**
    * Create a new user signed using teamId of who creates with an admin role
    * @param req body: name, password and role token: role, teamId role values: "admin", "supervisor", "employee"
    * @param res json with the new user
    */
   async newUser(req:any,res:any){
    console.log(req.user)
    try {
        if(req.user.role!=="admin" ){return res.status(403).json({error:"Not authorized to create a new user. Only admin roles can do this"})}
        if(!req.user){return res.status(401).json({error:"Authnetication couldn't be solved"})}
        if (!req.body){return res.status(400).json({error:"There is no body to create a new user"})}
        let {error}=userJoi.validate(req.body);        
        if(error){return res.status(400).json(error)}
        if(!req.body.role || req.body.role===undefined ||req.body.role==null){return res.status(401).json({error:"Not role defined"})}
        if(req.body.role!== "supervisor" && req.body.role!=="admin" && req.body.role!=="employee"){return res.status(401).json({error:"Not valid role"})}
        const teamId=new mongoose.Types.ObjectId(req.user.teamId);
        const team=await TeamModel.findById(teamId);
        if(!team || team==null){return res.status(404).json({error:"Team not found"})}
        const salt= await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(String(req.body.password),salt);
        const user= await new userModel({
            name:req.body.name,
            password:hashedPassword,
            role:req.body.role,
            teamId:req.user.teamId    
        });
        await user.save()
        .then((response:any)=>{return res.status(200).json(response)})
        .catch((error:any)=>{return res.status(500).json(error)});
         
    } catch (error) {
        console.log(error);
        res.json(error);
    }


   }
}


