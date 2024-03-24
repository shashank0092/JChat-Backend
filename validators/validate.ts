import { validationResult } from "express-validator";
import { NextFunction } from "express";
import { ApiError } from "../util/ApiError";

/**
 * 
 * @param {import("express").Request}req
 * @param {import("express").Response}res
 * @param {import("express").NextFunction}next 
 */

export const validate=(req:Request,res:Response,next:NextFunction)=>{
    const errors=validationResult(req)
    if(errors.isEmpty()){
        return next()
    }

    const extractredErrors:any=[]
    errors.array().map((err)=>extractredErrors.push({[err.type]:err.msg}))
    throw new ApiError(422,"Recvied Data is not valid",extractredErrors)
}
