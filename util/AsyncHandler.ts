/**
 * 
 * @param { 
 * 
 * 
 * (
 * req: import("express").Request, 
 * res: import("express").Response,
 * next:import("express").NextFunction
 * )=>void 
 * 
 * } requestHandler
 * 
 * 
 *           
 */

import { NextFunction } from "express"

const asyncHandler=(requestHnadler:(req:Request,res:Response,next:NextFunction)=>void)=>{
    return(req:Request,res:Response,next:NextFunction)=>{
        Promise.resolve(requestHnadler(req,res,next)).
        catch((err)=>next(err))
    }
}

export {asyncHandler}