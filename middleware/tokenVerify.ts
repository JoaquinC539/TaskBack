const jwt=require('jsonwebtoken');

const verifyToken=(req:any,res:any,next:any)=>{
    const token=req.header('Authorization');
    if(!token){return res.status(401).json({error:"Access Denied"})}
    try{
        const hash=token.split(" ");
        const verified=jwt.verify(hash[1],process.env.TOKEN as string);
        req.user=verified
        next();
    }catch(error){
        res.status(400).json({error:"Authorization rejected",description:error});
    }
}
module.exports=verifyToken