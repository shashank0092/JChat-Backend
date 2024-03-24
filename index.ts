import express from "express"
import morgan from "morgan"
import dotenv from "dotenv"
import { httpServer } from "./app"
import connectDB from "./db/conn"


dotenv.config({
    path:"./.env"
})

const startServer=()=>{
    httpServer.listen(process.env.PORT||8080,()=>{
        console.info(`Server is running at: http://localhost:${process.env.PORT||8080}`)
    })
}

connectDB()
.then(()=>{startServer()})
.catch((err)=>console.log("MongoDb Connection Error->",err))