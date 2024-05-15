import {Request} from "express"

export interface CustomeRequest extends Request {
    
      user:{
        _id: string;
        email: string;
        name?: string;
        imagePath?: string;
        about: string;
        phoneNumber: string;
      }

}