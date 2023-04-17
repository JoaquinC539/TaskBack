export class Cors{
    public corsOption:{};
    constructor(allowedOrigins:string[]){
        this.corsOption={
            origin:(origin:any,callback:CallableFunction)=>{
                if(allowedOrigins.indexOf(origin)===-1||!origin){
                    callback(null,true);
                }else{callback(new Error("Not allowed by cors"))}
            },
            credentials:true,
            optionSucess:200
        }
        
    }
}