
import { Request, Response } from "express"
import { user } from "../../models/user/user.model"
import { ApiResponse } from "../../util/ApiResponse"
import { chat } from "../../models/chat/chat.model"
import { emitSocketEvent } from "../../socket"
import { ChatEventEnum } from "../../constants"
import {CustomeRequest}  from "../../types/ReqUserObject"


const chatCommonAggregation=()=>{
    return[
        {
            $lookup:{
                from:"users",
                foreignField:'email',
                localField:"participants",
                as:"participants",
                pipeline:[
                    {
                        $project:{
                            password: 0,
                            refreshToken: 0,
                            forgotPasswordToken: 0,
                            forgotPasswordExpiry: 0,
                            emailVerificationToken: 0,
                            emailVerificationExpiry: 0,
                        }
                    }
                ]
            }
        },
        // {
        //     $lookup:{
        //         from:""
        //     }
        // },
        // {
        //     $addFields: {
        //         lastMessage: { $first: "$lastMessage" },
        //       }
        // }
    ]
}


const SearchUser = async (req: Request, res: Response) => {

    
    const { email } = req.body
    

    if (!email) {
        return res.status(400)
            .json({ message: "Email Is Required For Searching User" })
    }
    else {
        // const SearchedUser = await user.find({ email:{$regex:new RegExp(email,'i')}}, { "name": 1, "avtar": 1,"email":1 })

        
        const SearchedUser=await user.aggregate(
           [
            {
                $match:{
                    email: { $regex: new RegExp(email, 'i') }, // Search for email containing the given word
                    _id: { $ne: (req as any).user._id } // Exclude the logged-in user

                }
            },
            {
                $project:{
                    name:1,
                    mediaLink:1,
                    email:1
                }
            }
           ]
        )
        if(!SearchedUser){
            return res.status(404)
                        .json(new ApiResponse(404,{},"Not Find User"))
        }
        return res.status(200)
            .json(new ApiResponse(200, { data: SearchedUser }, "Find user"))
    }
}


const CreateAndGetOneOnOneChat=async(req:Request,res:Response)=>{
    const {email}=req.body
    

    const recvier=await user.find({email})

    if(!recvier){
        res.json({message:"User doesn't Exist"})
            .status(404)
    }

    if(email==(req as any).user.email){
        res.json({message:"You can't chat with your self"})
            .status(400)
    }

    const chats=await chat.aggregate(
        [
            {
                $match:{
                    isGroupChat:false,
                    $and:[
                        {
                            participants:{$elemMatch:{$eq:(req as any).user.email}}
                        },
                        {
                            paticipants:{
                                $elemMatch:{$eq:email}
                            }
                        }
                    ]
                }
            },
            // ...chatCommonAggregation()
        ])

       
        if(chats.length){
            return res.json({message:"Chat Retrived Succesfully",data:chats[0]})
                       .status(200)         
        }
        const newChatInstance=await chat.create({
            name:"One on one chat",
            participants:[(req as any).user.email,email],
            admin:(req as any).user.email
        })

        const createdChat=await chat.aggregate([
            {
                $match:{
                    _id:newChatInstance._id
                }
            },
            // ...chatCommonAggregation()
        ])

        const payload=createdChat[0]
        if(!payload){
            return res.json({message:"Internal Server Error"})
                      .status(500)
        }

        payload?.participants?.forEach((participant:any)=>{
            if(participant.email===(req as any).user.email) return;

            emitSocketEvent(
                req,
                participant._id?.toString(),
                ChatEventEnum.NEW_CHAT_EVENT,
                payload
            )
        })

        return res.status(201)
                   .json({message:"Chat recvied succesfully",data:payload})
}


const GetAllChat=async(req:CustomeRequest,res:Response)=>{

    console.log("running here")
    const chats=await chat.aggregate(
        [
            {
                $match:{
                    participants:{$elemMatch:{ $eq:req.user.email }}
                }
            },
            {
                $sort:{
                    updatedAt: -1,
                }
            },
            ...chatCommonAggregation()
        ]
    )
    
    
    
 

    return res.json({message:"User chat fetched succesfully",data:chats})
              .status(200)
}

export {
    SearchUser,
    CreateAndGetOneOnOneChat,
    GetAllChat
}


