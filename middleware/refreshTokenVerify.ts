import jwt from 'jsonwebtoken';

const verifyRefreshToken=(req:any,res:any,next:any)=>{
    const cookies=req.cookies.jwt;
    if(!cookies){return res.status(401).json({error:"Unauthorized"})}
    try{
        const verified=jwt.verify(cookies,process.env.REFRESH_TOKEN as string);
        req.user=verified;
        next();
    }catch(error){
        res.status(400).json({error:"Authorization rejected",description:error});
    }
}
module.exports=verifyRefreshToken