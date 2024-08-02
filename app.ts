import cookieParser from "cookie-parser"
import cors from "cors"
import { rateLimit } from "express-rate-limit"
import { createServer } from "http"
import {Server} from "socket.io"
import express from "express"
import requestIP from "request-ip"
import { ApiError } from "./util/ApiError"
import { ApiResponse } from "./util/ApiResponse"
import morganMiddleware from "./logs/morgan.logger"
import bodyParser from 'body-parser';
import {initializeSocketIo} from "./socket/index"

const app = express()
const httpServer = createServer(app)

const io=new Server(httpServer,{
    pingTimeout:60000,
    cors:{
        origin:"*",
        // credentials:true
    }
})
app.set("io",io)
app.use(express.static("public"))
app.use(bodyParser.json());
app.use(

    cors(
        {
            origin: "*",
            // credentials: true
        }

    )

)
app.use(requestIP.mw())

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        return req.clientIp || " "
    },
    handler: (_, __, ___, options) => {
        throw new ApiError(
            options.statusCode || 500,
            `There are too many requests.You are only allowed ${options.max} requests per ${options.windowMs / 60000} minustes`
        )
    }

})


app.use(limiter)
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(cookieParser())


// app.use(morganMiddleware)


import UserRouter from "./routes/auth/user.routes"
import ChatRouter from "./routes/chat/chat.routes"
import MessageRouter from "./routes/message/message.routes"
import path from "path"


app.use("/api/v1/user", UserRouter)
app.use("/api/v1/chat",ChatRouter)
app.use("/api/v1/message",MessageRouter)

const publicPath=path.join(__dirname,"public")
export const imagePath=path.join(publicPath,"images")

initializeSocketIo(io)



export { httpServer }