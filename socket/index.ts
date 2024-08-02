import cookie from "cookie"
import {Server,Socket} from "socket.io"
import { ApiError } from "../util/ApiError"
import jwt, { JwtPayload, Secret } from "jsonwebtoken"
import { user } from "../models/user/user.model"
import { ChatEventEnum,AvailableChatEvents } from "../constants"
import {Request} from "express"


const mountJoinChatEvent=(socket:Socket)=>{
    socket.on(ChatEventEnum.JOIN_CHAT_EVENT,(chatId):void=>{
        console.log('User joined the chat 🤝',chatId)
        socket.join(chatId)
    })
}

const mountParticipantTypingEvent=(socket:Socket)=>{
    socket.on(ChatEventEnum.TYPING_EVENT,(chatId):void=>{
        // socket.emit(ChatEventEnum.TYPING_EVENT,"shukla boi")
        console.log("typing is started event")
        socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT,chatId)
    })
}

const mountParticipantStoppedTypingEvent=(socket:Socket)=>{
    socket.on(ChatEventEnum.STOP_TYPING_EVENT,(chatId):void=>{
        console.log("typing is topped")
        socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT,chatId)
    })
}


interface decodedToken extends JwtPayload{
    _id:string
}

const initializeSocketIo=(io:Server)=>{
    console.log("shukla boi")
    return io.on("connection",async(socket):Promise<void>=>{
        try{
            const cookies=cookie.parse(socket.handshake.headers?.cookie||"")
            let token=cookies?.accessToken
            if(!token){
                token=socket.handshake.auth?.token
            }
            if(!token){
                throw new ApiError(401,"Un-authorized handsake, Token is missing")
            }

            const ACCESS_TOKEN_SECRET_KEY:Secret=process.env.ACCESS_TOKEN_SCERET_KEY as Secret
            const decodedToken=jwt.verify(token,ACCESS_TOKEN_SECRET_KEY) as decodedToken
            const User=await user.findById(decodedToken?._id).select(
                "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
            )

            if(!User){
                throw new ApiError(401,"Unauthorized handsake.Token is invalid")
            }
            (socket as any).user=User
            socket.join(User._id.toString())
            socket.emit(ChatEventEnum.CONNECTED_EVENT)
            console.log("User Connected 🆔:",(socket as any).user?._id)

            // Common Event That will happen on mounting

            mountJoinChatEvent(socket)
            mountParticipantTypingEvent(socket)
            mountParticipantStoppedTypingEvent(socket)

            socket.on(ChatEventEnum.DISCONNECT_EVENT,()=>{
                console.log("User Disconnected 🚫",(socket as any).user?._id)
                if((socket as any).user?._id){
                    socket.leave((socket as any).user?._id)
                }
            })


        }
        catch(err){
            socket.emit(
                ChatEventEnum.SOCKET_ERROR_EVENT,
                err||"Something went wrong"
            )
        }
    })
}
/**
 *
 * @param {import("express").Request} req - Request object to access the `io` instance set at the entry point
 * @param {string} roomId - Room where the event should be emitted
 * @param {AvailableChatEvents[0]} event - Event that should be emitted
 * @param {any} payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */

const emitSocketEvent=(req:Request,roomId:string,event:typeof AvailableChatEvents[0],payload:any)=>{
    console.log("emmting this event type",event)
    req.app.get("io").in(roomId).emit(event,payload)
}

export {initializeSocketIo,emitSocketEvent}