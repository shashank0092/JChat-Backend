import multer from "multer"
import path from "path"
import { getLocalPath } from "../util/helper"
import { imagePath } from "../app"


const publicDir=path.join(__dirname,"public")
const imagDir=path.join(publicDir,"images")
const storage=multer.diskStorage({
    destination:function(req,filles,cb){
        cb(null,imagePath)
    },
    filename:function(req,file,cb){
        let fileExtenstion=""
        if(file.originalname.split(".").length>1){
            fileExtenstion=file.originalname.substring(file.originalname.indexOf("."))
        }
        const fileNameWithoutExtenstion=file.originalname   
                                            .toLowerCase()
                                            .split(" ")
                                            .join("-")
                                            ?.split(".")[0]
        cb(null,
            fileNameWithoutExtenstion+
            Date.now()+
            Math.ceil(Math.random()*1e5)+
            fileExtenstion )
                                            
    }
})

export const upload=multer({
    storage,
    limits:{
        fileSize:1*1000*1000
    }
})
