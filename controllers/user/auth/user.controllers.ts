import { ApiError } from "../../../util/ApiError";
import { ApiResponse } from "../../../util/ApiResponse";
import { asyncHandler } from "../../../util/AsyncHandler";
import { Request, Response } from "express";
import { sendEmail,emailVerificationMailgenContent } from "../../../util/mail";
import crypto from "crypto"
import { user } from "../../../models/auth/user.model";

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

const genrateAcessAndRefreshToken = async (userId: string): Promise<TokenPair> => {

    try {
        const UserData = await user.findById(userId)

        if (UserData) {
            const accessToken = await UserData?.genrateAccessToken()
            const refreshToken = await UserData?.genrateRefreshToken()
            UserData.refreshToken = refreshToken
            await UserData.save({ validateBeforeSave: true })
            return { accessToken, refreshToken }
        }
        else {
            throw new ApiError(404, "User not found");
        }


    }

    catch (err) {
        console.log(err)
        throw new ApiError(500, "Something Went Wrong While Genrating Access And Refresh Token")
    }
}

const LoginUser = async (req: Request, res: Response) => {

    const { email, password } = req.body

    if (!password) {
        // THIS CODE BLOCK WILL BE USEFULL WHNE USER LOGIN USING GOOGLE LOGIN FEATURE

        console.log("this is running for google")
        const UserData = await user.findOne({ email })

        if (!UserData) {
            throw new ApiError(404, "User does not exist");
        }
        else {
            console.log("this is running for email and password")
            const { accessToken, refreshToken } = await genrateAcessAndRefreshToken(UserData._id)
            const loggedInUser = await user.findById(UserData._id).select(
                "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
            )
            return res
                .status(200)
                .cookie("accessToken", accessToken)
                .cookie("refreshToken", refreshToken)
                .json(
                    new ApiResponse(
                        200,
                        { user: loggedInUser, accessToken, refreshToken },
                        "User Logged In Suceefully"
                    )
                )
        }

    }
    else {
        // THIS CODE BLOCK WILL BE USEFULL WHILE USER LOGIN USING EMAIL AND PASSWORD
        const UserData = await user.findOne({ email })

        if (!UserData) {
            throw new ApiError(404, "User does not exist");
        }
        else {
            const isPasswordCorrect = await UserData.isPasswordCorrect(password)

            if (isPasswordCorrect) {
                const { accessToken, refreshToken } = await genrateAcessAndRefreshToken(UserData._id)

                const loggedInUser = await user.findById(UserData._id).select(
                    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
                )

                return res
                    .status(200)
                    .cookie("accessToken", accessToken)
                    .cookie("refreshToken", refreshToken)
                    .json(
                        new ApiResponse(
                            200,
                            { user: loggedInUser, accessToken, refreshToken },
                            "User Logged In Suceefully"
                        )
                    )
            }
            else {
                throw new ApiError(401, "Invalid Credaintials");
            }
        }


    }
}

const RegisterUser=async(req:Request,res:Response)=>{
    const{name,about,email,phoneNumber,password}=req.body

    const existedUser=await user.findOne({email})

    if(existedUser){
        throw new ApiError(409, "User with email already exists",[]);
    }
    else{
        const newUser=await user.create({
            email,password,name,about,phoneNumber
        })

        const {hashedToken,tokenExpiry,unHashedToken}=await newUser.genrateTemporaryToken()
        newUser.emailVerificationToken=hashedToken
        newUser.emailVerificationExpiry=tokenExpiry
        await newUser.save({validateBeforeSave:true})
        console.log(newUser,"this is new user that was genrated")
        
        await sendEmail({
            email:newUser?.email,
            subject:"Please Verify your email",
            mailgenContent:emailVerificationMailgenContent(
                newUser?.name,
                `${req.protocol}://${req.get("host")}/api/v1/user/verify-email/${unHashedToken}`
                
            )
        })

        const createdUser=await user.find(newUser._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )

        if(!createdUser){
            throw new ApiError(500,"Something went wrong while regersting the user")
        }
        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    {user:createdUser},
                    "User registred succesfully and email ahs been sent to your email"
                )
            )
    }
}

const VerifyEmail=async(req:Request,res:Response)=>{
    const {verificationToken}=req.params

    if(!verificationToken){
        throw new ApiError(400,"Email Verifiaction Token Is Missing")
    }

    let hashedToken=crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")

    const verifiedUser=await user.findOne({
        emailVerificationToken:hashedToken,
        emailVerificationExpiry:{  $gt:Date.now()  }
    })

    if(!verifiedUser){
        throw new ApiError(489,"Token Is Invalid")
    }

    verifiedUser.emailVerificationToken=undefined
    verifiedUser.emailVerificationExpiry=undefined
    verifiedUser.isEmailVerified=true

    await verifiedUser.save({validateBeforeSave:true})

    return res
        .status(200)
        .json(new ApiResponse(200,{isEmailVerified:true},"Email is verified"))


}

export {
    LoginUser,
    RegisterUser,
    VerifyEmail
}