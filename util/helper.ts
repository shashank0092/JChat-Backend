import {Request} from "express"
import path from "path"

export const getStaticFilePath=(req:Request,fileName:string)=>{
    return `${req.protocol}://${req.get("host")}/images/${fileName}`
    
}

export const getLocalPath=(fileName:string)=>{
    
    return `public/images/${fileName}`
}