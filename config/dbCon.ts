import mongoose from 'mongoose';
export class DBCon{
    constructor(){}
    public async connectDB(DBURI:string):Promise<void>{  
            console.log("Trying to connect to DB...");
            await mongoose.connect(DBURI)
            .then(()=>{console.log("DB connection succesful !!");})
            .catch((err)=>{console.log(err)});    
    }
}