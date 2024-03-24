import { Router } from "express";
import { validate } from "../../validators/validate";
import { userLoginValidator } from "../../validators/auth/user.validators";
import { LoginUser,RegisterUser,VerifyEmail } from "../../controllers/user/auth/user.controllers";
import { validationResult } from "express-validator";






const UserRouter=Router()

// unsecured route

UserRouter.route("/register").post(RegisterUser)
UserRouter.route("/login").post(userLoginValidator(),LoginUser)
UserRouter.route("/refresh-token").post()
UserRouter.route("/verify-email/:verificationToken").get(VerifyEmail)
UserRouter.route("/forgot-password").post()
UserRouter.route("/reset-password/:resetToken").post()

export default UserRouter;