import cookieParser from "cookie-parser"
import cors from "cors"
import {rateLimit} from "express-rate-limit"
import {createServer} from "http"
import express from "express"
import requestIP from "request-ip"
import { ApiError } from "./util/ApiError"
import { ApiResponse } from "./util/ApiResponse"
import morganMiddleware from "./logs/morgan.logger"
import bodyParser from 'body-parser';





const app=express()
const httpServer=createServer(app)
app.use(bodyParser.json());
app.use(cors({origin:"*"}))
app.use(requestIP.mw())

const limiter=rateLimit({
    windowMs:15*60*1000,
    max:500,
    standardHeaders:true,
    legacyHeaders:false,
    keyGenerator:(req,res)=>{
        return req.clientIp||" "
    },
    handler:(_,__,___,options)=>{
        throw new ApiError(
            options.statusCode||500,
            `There are too many requests.You are only allowed ${options.max} requests per ${options.windowMs/60000} minustes`
        )
    }
    
})


app.use(limiter)
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(cookieParser())
// app.use(morganMiddleware)


import UserRouter from "./routes/auth/user.routes"

app.use("/api/v1/user",UserRouter)



export {httpServer}