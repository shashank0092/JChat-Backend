import { Router } from "express";
import { validate } from "../../validators/validate";
import { userLoginValidator } from "../../validators/auth/user.validators";
import { LoginUser,RegisterUser,VerifyEmail,UploadImage,ForgetPasswordRequest,ResetForgottenPassword } from "../../controllers/user/auth/user.controllers";
import { validationResult } from "express-validator";
import multer from "multer";
import { ImageUploader } from "../../middleware/multer.middleware";



const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


const UserRouter=Router()

// unsecured route

UserRouter.route("/register").post(upload.fields([{name:"attachments",maxCount:5}])as any,ImageUploader("user"),RegisterUser)
UserRouter.route("/login").post(userLoginValidator(),LoginUser)
UserRouter.route("/imageauth").get(UploadImage)
UserRouter.route("/refresh-token").post()
UserRouter.route("/verify-email/:verificationToken").get(VerifyEmail)
UserRouter.route("/forgot-password").post(ForgetPasswordRequest)
UserRouter.route("/reset-password").post(ResetForgottenPassword)

export default UserRouter;