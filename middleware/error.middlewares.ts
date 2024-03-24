import mongoose from "mongoose";
import logger from "../logs/winston.logger.ts"
import {ApiError} from "../util/ApiError.ts"
import {Request,Response,NextFunction} from "express"


/**
 * 
 * @param {Error|ApiError} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */

const errorHnadler=(err:Error|ApiError,req:Request,res:Response,next:NextFunction)=>{
    let error: ApiError = err instanceof ApiError ? err : new ApiError(500, "Something went wrong");

    if(!(error instanceof ApiError)){
        // const statusCode = error instanceof mongoose.Error ? 400 : 500;
        // const message = error.message || "Something went wrong";
        // error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response={
        ...error,
        message:error.message,
        ...(process.env.NODE_ENV==="development"? {stack:error.stack}:{} ),
    }

    logger.error(`${error.message}`)
    return res.status(error.statusCode).json(response)
}

export {errorHnadler}