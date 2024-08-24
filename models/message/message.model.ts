import mongoose,{Schema,Model,Document,Types} from "mongoose";

interface ChatMessageDocument extends Document{
    sender:Schema.Types.ObjectId,
    content:string,
    attachments:Attachment[],
    chat:Types.ObjectId
}

interface Attachment {
    url: string;
    type: string;
    name:string;
    size:Number
}

const attachmentSchema = new Schema<Attachment>({
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    name:{
        type:String,
        required:true
    },
    size:{
        type:Number,
        required:true
    }
  });


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
            type:[attachmentSchema],
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