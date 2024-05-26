import mongoose,{Schema,Model,Document,Types} from "mongoose";
import { MessageFileType } from "../../types/FileType";

interface ChatMessageDocument extends Document{
    sender:Schema.Types.ObjectId,
    content:string,
    attachments:MessageFileType[],
    chat:Types.ObjectId
}



const chatMessageSchema=new Schema<ChatMessageDocument>(
    {
        sender:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        content:{
            type:String
        },
        attachments:{
            type:[
                {
                    url:String,
                    localPath:String
                }
            ],
            default:[]
        },
        chat:{
            type:Schema.Types.ObjectId,
            ref:"Chat"
        }
    },
    {timestamps:true}

)

export const chatMessage:Model<ChatMessageDocument> =mongoose.model<ChatMessageDocument>("chatMessage",chatMessageSchema)