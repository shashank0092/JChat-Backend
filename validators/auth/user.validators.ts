import { body,param } from "express-validator";


const userLoginValidator=()=>{
    return[
        body("email")
        .notEmpty()
        .withMessage("Email Is Required!")
        .isEmail()
        .withMessage("Email is invalid")
    ]
}

export {
    userLoginValidator
}