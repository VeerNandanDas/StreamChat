import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import express from "express"

const app = express();
dotenv.config();
app.use(cookieParser());


export const checkAuth = async(req,res,next)=>{
    
    try {
        console.log(req.cookies);
        let token = req.cookies?.TOKEN;
        
        if(!token){
            console.log("No token");
            return res.status(401).json({
                succes:false,
                message : "Authentication failed"
            })
        }
 
       const decoded =  jwt.verify(token,process.env.JWT_SECRET);
       req.user = decoded;

       next()
        
    } catch (error) {
        console.log("AUTH MIDDLE FAILED");
        return res.status(500).json({
            msg : "Internal server error "
        })
    }

    
}
