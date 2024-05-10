import mongoose,{Schema,Model,Document, Types} from "mongoose";

interface ChatDocument extends Document{
    name:string,
    isGroupChat?:boolean,
    lastMessage:Schema.Types.ObjectId,
    participants:Types.ObjectId[],
    admin:Schema.Types.ObjectId
}

const chatSchema=new Schema<ChatDocument>(
    {
        name:{
            type:String,
            required:true
        },
        isGroupChat:{
            type:Boolean,
            default:false
        },
        lastMessage:{
            type:Schema.Types.ObjectId,
            ref:"ChatMessage"
        },
        participants:[
            { type:Schema.Types.String,ref:"User" }
        ],
        admin:{
            type:Schema.Types.String,
            ref:"User"
        }
    },
    {timestamps:true}
)

export const chat:Model<ChatDocument> =mongoose.model<ChatDocument>("Chat",chatSchema)