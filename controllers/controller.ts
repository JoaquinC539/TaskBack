import { taskJoi } from "../models/Task/taskjJoi";
const mongoose=require('mongoose');
const path=require('path');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const TeamModel=require('../models/Team/Team');
const teamJoi=require('../models/Team/Teamjoi');
const userJoi=require('../models/User/Userjoi');
const userModel=require('../models/User/User');
const adminJoi=require('../models/User/AdminJoi');
const taskModel=require('../models/Task/Task');
const Error=mongoose.Error

type User={
    teamId:string,
    name:string,
    role:string,
    _id:string,
    password:string,
    error:string,
    department:string
}

type Error={
    
        message:string | null,
        error:any
    
}
type Task={
    title:string,
    senderName:string,
    userId:any,
    type:string,
    roleType:string,
    description:string,
    completion:boolean,
    comment:string,
    assignment:string,
    teamId:string,
    department:string
}
export class Controller{

    constructor(){

    }
    view(req:any,res:any){
        res.sendFile(path.join(__dirname,'..','views','index.html'));
    }
    /**
     * 
     * @param req name: Team name to be generated
     * @param res team name and id
     * @returns json response and new team saved into DB
     */
    async newTeam(req:any,res:any):Promise<any>{
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
    async newAdminUser(req:any,res:any):Promise<any>{
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
                role:"admin",
                department:"direction"
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
    async getTeam(req:any,res:any):Promise<any>{
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
    async login(req:any,res:any):Promise<any>{
        try{
            const user=await userModel.findOne({name:req.body.name});
            if(!user || user===null || user==undefined){return res.status(404).json({error:"User not found"})}
            const password:string=await bcrypt.compare(String(req.body.password),String(user.password));
            if(!password || password===null || password===undefined){ return res.status(401).json({error:"Invalid or incorrect password"})}
            const token=jwt.sign({
                name:user.name,
                _id:user._id,
                role:user.role,
                teamId:user.teamId,
                department:user.department
            },process.env.TOKEN as string,{expiresIn:process.env.EXPIRE_TOKEN as string});
            const refreshToken=jwt.sign({
                name:user.name,
                _id:user._id,
                role:user.role,
                teamId:user.teamId,
                department:user.department
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

   /**
    * 
    * @param req Cookie 'jwt' with refresh token
    * @param res json containing a new shortlived access token
    * @returns json
    */
   async refreshToken(req:any,res:any):Promise<any>{
    const user=await req.user;
    const token=await jwt.sign({
        name:user.name,
        _id:user._id,
        role:user.role,
        teamId:user.teamId,
        department:user.department
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
   async getUser(req:any,res:any):Promise<any>{   
    try {

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
        if(req.query.department){
            query.department=req.query.department
        }
            await userModel.find(query).exec()
            .then((response:any)=>{return res.status(200).json(response)})
            .catch((err:any)=>{return res.status(500).json(err)})
         
    } catch (error) {
        return res.status(500).json({error})
    }
    
    
   }
   /**
    * Create a new user of a team. Only can be created by someone with admin role. Team id is gotten from credentials
    * @param req body: name, password and role token: role, teamId role values: "admin", "supervisor", "employee"
    * @param res json with the new user
    */
   async newUser(req:any,res:any):Promise<any>{
    try {
        if(req.user.role!=="admin" ){return res.status(403).json({Unauthorized:"Not authorized to create a new user. Only admin roles can do this"})}
        if(!req.user){return res.status(401).json({error:"Authentication couldn't be solved"})}
        if (!req.body){return res.status(400).json({error:"There is no body to create a new user"})}
        let {error}=userJoi.validate(req.body);        
        if(error){return res.status(400).json(error)}
        if(!req.body.role || req.body.role===undefined ||req.body.role==null){return res.status(401).json({error:"Not role defined"})}
        if(req.body.role!== "supervisor" && req.body.role!=="admin" && req.body.role!=="employee"){return res.status(401).json({error:"Not valid role"})}
        // const teamId=new mongoose.Types.ObjectId(req.user.teamId);
        // const team=await TeamModel.findById(teamId);
        // if(!team || team==null){return res.status(404).json({error:"Team not found"})}
        const salt= await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(String(req.body.password),salt);
        const user= await new userModel({
            name:req.body.name,
            password:hashedPassword,
            department:req.body.department,
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
   /**
    * Updates user role, password, name and/or role, note: employee  and supervisor can't modify their role just admins. To modify name and password only can be done by the user itself
    * @param req data of fields to be changed and user _id
    * @param res json with new data (hashed password)
    */
   async editUser(req:any,res:any):Promise<any>{
    if(!req || req===undefined || req===null){return res.json({error:"Bad request"})}
    if(!req.body || req.body===undefined || req.body===null ){return res.json({error:"Bad request"})}
    try {
        let personalUpdate:boolean=false;
        let roleUpdate:boolean=false;
        if(!req.body._id ){return res.status(400).json({error:"Not id provided "})}
        if(req.body._id.length!==24){return res.status(400).json({error:"Bad id provided"})}
        if(typeof req.body._id !=="string"){return res.status(400).json({error:"Bad request"})}
        if(req.body._id) 
        if(req.body._id && req.user._id==req.body._id){personalUpdate=true}
        if(req.user.role==="admin"){roleUpdate=true}
        if(!personalUpdate && req.body.name || !personalUpdate && req.body.password){return res.status(401).json({Unauthorized:"Not allowed to edit names and personal information of others"})}
        if(!roleUpdate && req.body.role){return res.status(401).json({Unauthorized:"Not allowed to modify your or others roles. Ask and admin to do that"})}
        const targetId=await new mongoose.Types.ObjectId(String(req.body._id));
        const userQuery=await userModel.find({_id:targetId,teamId:req.user.teamId});
        if(!userQuery || userQuery===null || userQuery===undefined){return res.status(404).json({error:"User not found"})}
        if(userQuery.teamId!==req.user.teamId){return res.status(402).json({forbidden:"Not allowed to modified another teams"})}
        let user=await {} as User;
        let response=await {} as Error;
        response.message=null;


        if(req.body.name && personalUpdate){user.name=req.body.name }
        if(req.body.password && personalUpdate){ 
            const salt=await bcrypt.genSalt(10);
            const hashedPassword=await bcrypt.hash(String(req.body.password),salt);
            user.password=hashedPassword; 
        }
         if(roleUpdate && req.body.role){
            if(req.user.role==="admin" ){
                
                if((req.body.role=="admin" || req.body.role=="supervisor" || req.body.role=="employee")){
                    user.role=req.body.role;

                }else{
                    return res.status(400).json({error:"Not valid role "})
                }
                if(req.body.department){
                    user.department=req.body.department;
                }
            }
            else{response.message="Role is not an admin, role wasn't changed."}
         }
         
          await userModel.findOneAndUpdate( {_id:targetId},user);
         const queriedUser=await userModel.findOne({_id:targetId});

        return res.status(200).json({user:queriedUser,error:response})
    } catch (error) {
        return res.json(error);
    }
   }
   /**
    * Delete one user, only admin role can perform this action
    * @param req _id:24 length string
    * @param res error or status 200 operation
    * @returns void
    */
   async deleteUser(req:any,res:any):Promise<any>{
    try {
        
        if(!req.body ||!req.body._id || req.body._id===null || req.body._id===undefined){return res.status(400).json({error:"Not id provided or error in request"})}
        if(req.user.role!=="admin"){return res.status(402).json({Unauthorized:"Just an admin role can perform this action"})}
        if(req.body._id.length!==24){return res.status(401).json({Error:"Error in id or not valid"})}
        let targetId:any
        let validId:any=await mongoose.Types.ObjectId.isValid(req.body._id)
        if(validId){
            console.log(mongoose.Types.ObjectId.isValid(req.body._id))
            targetId=req.body._id
        }else{
            targetId=await new mongoose.Types.ObjectId(String(req.body._id));
        }
        const userToDelete:any=await userModel.find({_id:targetId,teamId:req.user.teamId});
        if(!userToDelete || userToDelete===null || userToDelete===undefined){return res.status(200).json({error:"User to delete not found"})}
        if(userToDelete.teamId!==req.user.teamId){return res.status(401).json({Unauthorized:"Can't modify other teams"})}
        await userModel.deleteOne({_id:targetId})
        .then((response:any)=>{console.log(response)})
        .catch((error:any)=>console.log(error));
        return res.status(200).json({message:"Operation succesful"});

       
    } catch (error) {
        console.log(error);
        return res.status(500).json({error:"An error ocurred"});
    }

   } 
   /**
    * Add as new task to somebody, admin can assign tasks to himself and other admins, supervisor and employees. Supervisor can assugn task to himelf and employees. Employees can't
    * @param req title, userId, type, description, roleType and optional comment
    * @param res 
    */   
   async newTask(req:any,res:any):Promise<any>{
    const {error}=taskJoi.validate(req.body);
    if(error){return res.status(401).json({error:"Error in task creation check the error",description:error.details[0].message})}
    if(req.user.role!=="employee"){return res.status(402).json({Unauthorized:"Not authorized, only admin or supervisor can asign new tasks"});}
    let targetUser=await userModel.find({teamId:req.user.teamId,_id:req.body.userId}).exec();
    if(!targetUser || targetUser==null || targetUser==undefined || !targetUser.length){return res.status(404).json({error:"Employee not found"});}
    if(targetUser[0].role=="admin" && req.user.role!=="admin"){return res.status(402).json({error:"Only admin can assign task to admin"});}
    if(targetUser[0].role=="supervisor" && targetUser[0]._id.toString()!==req.user._id && req.user.role!=="admin"){return res.status(402).json({error:"Cant assign tasks to other supervisors except self"}) }
    if(targetUser[0].department!==req.user.department && req.user.role!=="admin"){return res.status(402).json({error:"Supervisors can only asign task to employees of the same department"})}
    if(req.user.role=="supervsior" && (req.body.roleType=="admin" )){return res.status(402).json({error:"A supervisor can't assign admn type role tasks"})}
    try {
        const task=new taskModel({
            teamId:req.user.teamId,
            title:req.body.title,
            senderName:req.user.name,
            userId:req.body.userId,
            type:req.body.type,
            roleType:targetUser[0].role,
            description:req.body.description,
            department:req.body.department,
            completion:false,
            comment:req.body.comment
         });
         await task.save()
         .then((response:any)=>res.status(200).json(response))
         .catch((error:any)=>res.status(500).json(error))
        
    } catch (error) {
        return res.status(500).json(error);
    }
   }
   /**
    * Query task from the DB using role permissions, employees can only retreat their own taks, supervisor can see employees and self tasks, admins can query all the data from every person in the team
    * @param req query params: multiple userId, _id,name,title, completion,senderName,comment,type,assignment
    * @param res query data or error if not authorized or according data
    * 
    */
   async getTasks(req:any,res:any):Promise<any>{
    try {

        const query={} as Task;
        query.teamId=req.user.teamId;
        if(req.user.role==="employee"){
            query.userId=req.user._id;
        }
        if(req.user.role==="supervisor"){
            let queriedEmployee=await userModel.find({teamId:req.user.teamId,role:"employee"}).exec();
            const employeesIds=queriedEmployee.map((employee:any)=>employee._id.toString());
            employeesIds.push(req.user._id.toString());
            
            if(req.query.userId){
                let queryUserIds:string[]=(req.query.userId.split(","));
                if(employeesIds.some((id: string)=>queryUserIds.includes(id))){
                    query.userId={$in:queryUserIds};
                }else{return res.status(404).json({error:"Employee not found or higher hierarchy tasks not allowed to retreat"})}
            }else{
               query.userId={$in:employeesIds}
            
               
            }
        }

        if(req.user.role==="admin"){

            if(req.query.userId){
                let queryUserIds:string[]=(req.query.userId.split(","));
                query.userId={$in:queryUserIds};                
            }
        }
 
        if(req.query.title){
            query.title =req.query.title;
          }
          
          if(req.query.senderName){
            query.senderName = req.query.senderName;
          }
          
          if(req.query.type){
            query.type =req.query.type;
          }
          
          if(req.query.description){
            query.description = req.query.description;
          }
          
          if(req.query.completion){
            query.completion = req.query.completion;
          }
          
          if(req.query.comment){
            query.comment =req.query.comment;
          }
          
          if(req.query.assignment){
            query.assignment = req.query.assignment;
          }
          if(req.query.department){
            query.department=req.query.department;
          }

          try {
            await taskModel.find(query)
            .then((response:any)=>res.status(200).json(response))
            .catch((err:any)=>console.log(err));
            return;
          } catch (error) {
            return res.status(500).json(error)
          }         
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
   }/**
    * Edit a Task, credentials role not required to edit a task
    * @param req _id task id, and/or title, type, description, completion, and comment || Can't be updated:  teamId, senderName, req.body.assignment, userId, RoleType (Admin exception).
    * @param res success or error json
    */
   async updateTask(req:any,res:any){
        function buildObject(role:string="employee"){
            let update={} as Task;

            if (req.body.title) {
            update.title = req.body.title;
            }
            if (req.body.type) {
            update.type = req.body.type;
            }
            if (req.body.description) {
            update.description = req.body.description;
            }
            if (req.body.completion) {
            update.completion = req.body.completion;
            }
            if (req.body.comment) {
            update.comment = req.body.comment;
            }
            if(role==="admin"){
                if(req.body.roleType){
                    update.roleType=req.body.roleType;
                }
                if(req.body.senderName){
                    update.senderName=req.body.senderName;
                }
                if(req.body.userId){
                    update.senderName=req.body.userId;
                }
                if(req.body.department){
                    update.department=req.body.department;
                }
            }   

            return update
        }
    if(req.body.teamId){return res.status(403).json({forbidden:"Can't change task of teamId"})}
    if(!req.body._id ){return res.status(400).json({error:"No Task Id provided (_id)"})}
    if(req.body._id.length!==24 && req.query._id.length!==24){
        return res.status(400).json({error:"Bad task id request"});
    }
    if((req.body.senderName || req.body.assignment || req.body.userId || req.body.roleType || req.body.department) && req.user.role!=="admin"){return res.status(403).json({forbidden:"Can't change sender, assign date, userId or roleType task"})}         try {

                const taskId=await new mongoose.Types.ObjectId(String(req.body._id));               
                const employeeTask=await taskModel.find({_id:req.body._id,teamId:req.user.teamId});
                if(!employeeTask||employeeTask==null || employeeTask===undefined){return res.status(404).json({error:"Task not found"})}
                await taskModel.findOneAndUpdate({_id:taskId,teamId:req.user.teamId},buildObject(req.user.role)).exec();                      
                return await res.json({update:"success"});
        } catch (error) {
            return res.status(500).json({error:error});
        }
   }
   /**
    * Delete a task according to parameters and role.
    * Admin can delete every task without restriction under the same team.
    * Supervisor can only delete it's own tasks asigned by itself or admins and employees
    * Employees can't delete any task
    * @param req _id
    * @param res success message or error
    *  
    */
   async deleteTask(req:any,res:any):Promise<any>{
    if((!req.body._id || req.body._id.length!==24) && typeof req.body._id!=="string"){res.status(402).json({})}
    if(req.user.role==="employee"){res.status(402).json({error:"Not authorized to perform this action"});}
    else if(req.user.role==="supervisor"){
        const _id=new mongoose.Types.ObjectId(String(req.body._id));
        let task=await taskModel.findById(_id).exec();
        if(task.department!==req.user.department){return res.status(402).json({error:"Employee task is not on the same department"});}
        if(!task || task===null || task===undefined){return res.status(404).json({error:"Task not found"})}
        if((task.roleType==="employee" || (task.roleType==="supervisor" && task.userId===String(req.user._id)))){
           await taskModel.deleteOne({_id:_id,teamId:req.user.teamId})
           .then((response:Response)=>res.status(200).json({message:"Task deleted",response:response}))
           .catch((error:Error)=>res.status(500).json({error:error}));
        }else{return res.status(402).json({error:"Not allowed to modify other supervisors or admin tasks"});}
    }
    else if(req.user.role==="admin"){
        const _id=new mongoose.Types.ObjectId(String(req.body._id));
        let task=await taskModel.findById(_id).exec();
        if(!task || task===null || task===undefined){return res.status(404).json({error:"Task not found"})}
        await taskModel.deleteOne({_id:_id,teamId:req.user.teamId})
        .then((response:Response)=>res.status(200).json({message:"Task deleted",response:response}))
        .catch((error:Error)=>res.status(500).json({error:error}));
    }
   }
   /**
    * Only edit team name
    * @param req _id,name
    * @param res 
    */
   async editTeam(req:any,res:any){
    if(req.user.role!=="admin"){return res.status(402).json({error:"Only admin can change team name"})}
    if(req.user.department!=="direction"){return res.status(402).json({error:"Only admin in direction role can change team name"})}
    if(!req.body.name || req.body.name===null || req.body.name===undefined){return res.status(400).json({error:"Team name not valid"})}
    try {
        const team=await TeamModel.findById(req.user.teamId);
        if(team && team!==null && team!==undefined){
            TeamModel.findOneAndUpdate({_id:req.body.teamId,name:req.body.name});
            return res.status(201).json({response:"Team name updated to: "+String(req.body.name)});
        }else{
            return res.status(404).json({error:"Team not found"});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({error:"Server Error",body:error});
    }
    }
    

}


