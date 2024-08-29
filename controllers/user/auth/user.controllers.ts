import { ApiError } from "../../../util/ApiError";
import { ApiResponse } from "../../../util/ApiResponse";
import { asyncHandler } from "../../../util/AsyncHandler";
import { Request, Response } from "express";
import { sendEmail, emailVerificationMailgenContent, forgotPasswordMailgenContent } from "../../../util/mail";
import crypto from "crypto"
import { user } from "../../../models/user/user.model";
import { ImageIoConfig } from "../../../util/ImageKitConfrigutaion";
import ImageKit from "imagekit";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { CustomeRequest } from "../../../types/ReqUserObject"
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

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
        console.log("running this google login function")
        const UserData = await user.findOne({ email })

        if (!UserData) {
            // throw new ApiError(404, "User does not exist");
            res.status(404)
                .json({ message: "User does not exist" })
        }
        else {

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
            res.status(404)
                .json({ message: "User does not exist" })
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
                res.status(401)
                    .json({ message: "Invalid Credaintials" })

            }
        }


    }
}

const RegisterUser = async (req: CustomeRequest, res: Response) => {
    const { name, about, email, phoneNumber, password } = req.body
    console.log(req.files, "this is all file")


    const existedUser = await user.findOne({ email })

    if (existedUser) {

        return res.status(409)
            .json({ message: "User with email already exists" })
    }
    else {
        let mediaLink;

        if (req?.uploadedKeys?.length > 0) {
            mediaLink = req.uploadedKeys.map((media) => {
                const url = getSignedUrl({
                    url: `https://d2mhnmhkxs9bvr.cloudfront.net/${media.url}`,
                    dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString(),
                    privateKey: process.env.CLOUD_FRONT_KEY_PRIVATE_KEY,
                    keyPairId: process.env.CLOUD_FRONT_KEY_PAIR_ID
                })

                return {
                    url: url,
                    type: media.type,
                    name: media.name,
                    size: media.size
                }

            })
        }
        const newUser = await user.create({
            email, password, name, about, attachment: req.uploadedKeys, phoneNumber, mediaLink
        })

        const { hashedToken, tokenExpiry, unHashedToken } = await newUser.genrateTemporaryToken()
        newUser.emailVerificationToken = hashedToken
        newUser.emailVerificationExpiry = tokenExpiry

        await newUser.save({ validateBeforeSave: true })
        console.log(newUser, "this is new user that was genrated")

        await sendEmail({
            email: newUser?.email,
            subject: "Please Verify your email",
            mailgenContent: emailVerificationMailgenContent(
                newUser?.name,
                `${req.protocol}://${req.get("host")}/api/v1/user/verify-email/${unHashedToken}`

            )
        })

        const createdUser = await user.find(newUser._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )

        if (!createdUser) {

            return res.status(500)
                .json({ message: "Something went wrong while regersting the user" })
        }
        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    { user: createdUser },
                    "User registred succesfully and email ahs been sent to your email"
                )
            )
    }
}

const VerifyEmail = async (req: Request, res: Response) => {
    const { verificationToken } = req.params

    if (!verificationToken) {

        res.status(400)
            .json({ message: "Email verification token is Missing" })
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")

    const verifiedUser = await user.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() }
    })

    if (!verifiedUser) {

        return res.status(489)
            .json({ message: "Tokn Is Invalid" })
    }

    verifiedUser.emailVerificationToken = undefined
    verifiedUser.emailVerificationExpiry = undefined
    verifiedUser.isEmailVerified = true

    await verifiedUser.save({ validateBeforeSave: true })

    return res
        .status(200)
        .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"))


}

const UploadImage = async (req: Request, res: Response) => {
    try {
        const config = await ImageIoConfig()

        if (config instanceof ImageKit) {
            const result = config.getAuthenticationParameters()
            res.send(result)
        }
        else {
            res.status(500)
                .json({ message: "Not have image io instance" })
        }


    }
    catch (err) {
        res.json({ err: err, message: "Can not get image uploading authenticator" })
    }
}

const ForgetPasswordRequest = async (req: Request, res: Response) => {
    const { email } = req.body

    const requesting_password_user = await user.findOne({ email })

    if (!requesting_password_user) {
        return res.status(404)
            .json({ message: "User does not exist" })
    }

    else {
        const temporaryTokenData = await requesting_password_user?.genrateTemporaryToken();

        if (temporaryTokenData) {
            const { unHashedToken, hashedToken, tokenExpiry } = temporaryTokenData;
            requesting_password_user.forgotPasswordToken = hashedToken;
            requesting_password_user.forgotPasswordExpiry = tokenExpiry;
        }

        await requesting_password_user?.save({ validateBeforeSave: false })

        await sendEmail({
            email: requesting_password_user?.email,
            subject: "Password reset request",
            mailgenContent: forgotPasswordMailgenContent(
                requesting_password_user?.email,
                `http://localhost:5173/forget-password/${temporaryTokenData.unHashedToken}`
            )
        })

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password reset mail has been send to your mail id"))


    }
}


const ResetForgottenPassword = async (req: Request, res: Response) => {
    console.log("we are here")
    const { resetToken } = req.body
    const { newPassword } = req.body

    let hasedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    const reset_password_user = await user.findOne({
        forgotPasswordToken: hasedToken,
        forgotPasswordExpiry: { $gt: Date.now() }

    })

    if (!reset_password_user) {
        return res.status(489)
            .json({ message: "Token is invlaid or expire" })
    }
    else {
        reset_password_user.forgotPasswordToken = undefined
        reset_password_user.forgotPasswordExpiry = undefined
    }

    reset_password_user.password = newPassword
    await reset_password_user.save({ validateBeforeSave: false })
    return res.
        status(200)
        .json(new ApiResponse(200, {}, "Password reset sucessfully"))
}


interface decodedToken extends JwtPayload {
    _id: string
}

const refreshAcessToken = async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        return res.status(401)
            .json({ message: "Unauthorized request" })
    }

    try {

        const REFRESH_TOKEN_SCERET_KEY: Secret = process.env.REFRESH_TOKEN_SCERET_KEY as Secret
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            REFRESH_TOKEN_SCERET_KEY
        ) as decodedToken

        const refresh_user = await user.findOne({ _id: decodedToken._id })

        if (!refresh_user) {
            return res.status(401)
                .json("Invalid refresh toj=ken")
        }

        if (incomingRefreshToken !== refresh_user?.refreshToken) {
            return res.status(401)
                .json("Refresh token is expired or used")
        }

        const options = {
            httpOnly: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await genrateAcessAndRefreshToken(refresh_user?._id)

        return res.status(200)
            .cookie("accesToken", accessToken)
            .cookie("refreshToken", newRefreshToken)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Acess token refresed"
                )
            )

    }
    catch (err) {
        console.log("this is error->", err)
        return res.status(401)
            .json({ message: `Invalid refresh toke ${err}` })
    }
}

export {
    LoginUser,
    RegisterUser,
    VerifyEmail,
    UploadImage,
    ForgetPasswordRequest,
    ResetForgottenPassword

}