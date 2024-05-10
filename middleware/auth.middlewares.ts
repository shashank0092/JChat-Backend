import {Request,Response,NextFunction} from "express"
import jwt, { JwtPayload, Secret } from "jsonwebtoken"
import { user } from "../models/user/user.model"

interface decodedToken extends JwtPayload{
    _id:string
}

export const verifyJWT=async(req:Request,res:Response,next:NextFunction)=>{

    const token=req.cookies?.accesToken||req.header("Authorization")?.replace("Bearer ","")
   
    if(!token){
        return res.status(401)
            .json({message:"Unauthorized request"})
    }

    try{
        const ACCESS_TOKEN_SECRET_KEY:Secret=process.env.ACCESS_TOKEN_SCERET_KEY as Secret
        const decodedToken=jwt.verify(token,ACCESS_TOKEN_SECRET_KEY) as decodedToken
        const User=await user.findById(decodedToken._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )
        
        // console.log(decodedToken,"this is decoded token")
        if(!User){
            return res.status(401)
                    .json({message:"Invalid Acess Token"})
        }

        (req as any).user=User
        
        next()

    }
    catch(err){
        return res.status(401)
                   .json({message:err})
    }
}