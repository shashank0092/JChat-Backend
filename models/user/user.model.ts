import mongoose, { Schema,Document,Model } from "mongoose";
import bcrypt from "bcrypt"
import jwt, { Secret } from "jsonwebtoken"
import crypto from "crypto"

interface Attachment {
    url: string;
    type: string;
    name:string;
    size:Number
}

interface MediaLink{
    url:string,
    type:string,
    name:string,
    size:Number
}
const mediaLinkSchema=new Schema<MediaLink>({
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
   
},
{timestamps:true}
)

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

interface UserDocument extends Document{
    email:string;
    name?:string;
    attachment?:Attachment;
    password:string;
    about:string;
    phoneNumber:string;
    refreshToken?:string;
    isEmailVerified:boolean;
    forgotPasswordToken?: string;
    forgotPasswordExpiry?: Date;
    emailVerificationToken?: string;
    emailVerificationExpiry?: Date;
    mediaLink:MediaLink
    
    isPasswordCorrect(password: string): Promise<boolean>;
    genrateAccessToken(): string;
    genrateRefreshToken(): string;
    genrateTemporaryToken(): { unHashedToken: string, hashedToken: string, tokenExpiry: Date };



}

const userSchema=new Schema <UserDocument> (
    {
        email:{
            type:String,
            required:true,
            unique:true,
            index:true
        },
        name:{
            type:String
        },
        attachment:{
            type:[attachmentSchema]
        },
        mediaLink:{
            type:[mediaLinkSchema],
            default:[]
        },
        password:{
            type:String,
            required:true
        },
        about:{
            type:String,
            required:true
        },
        phoneNumber:{
            type:String,
            required:true
        },
        refreshToken:{
            type:String
        },
        isEmailVerified:{
            type:Boolean,
            default:false
        },
        forgotPasswordToken:{
            type:String
        },
        forgotPasswordExpiry:{
            type:Date
        },
        emailVerificationToken:{
            type:String
        },
        emailVerificationExpiry:{
            type:Date
        }
    },
    {timestamps:true}
)


userSchema.pre<UserDocument>("save",async function(next){
    if(!this.isModified("password")) return next()

    this.password=await bcrypt.hash(this.password,10)
    next()
})


userSchema.methods.isPasswordCorrect=async function(password:string):Promise<boolean>{
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.genrateAccessToken=function(){
    const payload = {
        name: this.name,
        _id: this._id,
        email: this.email
    };

    
    const secretKey: Secret = process.env.ACCESS_TOKEN_SCERET_KEY as Secret;
    
    const expiresIn =process.env.ACCESS_TOKEN_EXPIRY;
    const token = jwt.sign(payload, secretKey, { expiresIn });
    return token
}

userSchema.methods.genrateRefreshToken=function(){
    const payload={
        _id:this._id
    }
    const secretKey: Secret = process.env.REFRESH_TOKEN_SCERET_KEY as Secret;
    const expiresIn =process.env.REFRESH_TOKEN_EXPIRY;
    const token = jwt.sign(payload, secretKey, { expiresIn });
    return token
}

userSchema.methods.genrateTemporaryToken=function(){

    const unHashedToken=crypto.randomBytes(20).toString("hex")
    const hashedToken=crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex")
    const tokenExpiry=Date.now()+20000
    return {unHashedToken,hashedToken,tokenExpiry}
}

export const user:Model<UserDocument> = mongoose.model<UserDocument>("User",userSchema)