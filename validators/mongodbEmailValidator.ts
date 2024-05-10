import {param} from "express-validator"
export const mongoDBEmailValidator=(email:any)=>{

    return[
        param(email).notEmpty().isEmail().withMessage(`Invalid email ${email}`)
    ]

}   