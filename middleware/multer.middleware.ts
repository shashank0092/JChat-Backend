import { NextFunction, Request, Response } from "express"
import { CustomeRequest } from "../types/ReqUserObject"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "../util/S3Client"



export const ImageUploader = (ImagePath) => {

    return async (req: CustomeRequest, res: Response, next: NextFunction) => {

        let uploadedKeys: { url: string; type: string, name: string, size: Number }[] = [];
        

        if (req.files) {
            

            (req as any).files?.attachments?.map(async (attachment: Express.Multer.File) => {

                let fileExtenstion;
                let email;
                if(ImagePath=="media"){
                    email=req.user?.email.split("@")[0]
                }
                else if(ImagePath=="user"){
                    email=req.body?.email.split("@")[0]
                }
                if (attachment.originalname.split(".").length > 1) {
                    fileExtenstion = attachment.originalname.substring(attachment.originalname.lastIndexOf(".") + 1)
                }
                else {
                    fileExtenstion = "other"
                }
                const key = `${email}/${ImagePath}/${fileExtenstion}/${attachment.originalname + Date.now()}`;
                uploadedKeys.push({
                    url: key,
                    type: fileExtenstion,
                    name: attachment.originalname,
                    size: attachment.size,
                })
                req.uploadedKeys = uploadedKeys
                const command = new PutObjectCommand({
                    Bucket: "devjchat",
                    Key: key,
                    Body: attachment.buffer,
                    ContentType: attachment.mimetype
                })
                const s3Response = await s3Client.send(command)


                if (s3Response.$metadata.httpStatusCode == 200) {
                    console.log(s3Response)
                }
                else {
                    return res.json({ message: "Not Able To Upload File At S3", status: 400 })
                }

            })
        }


        next()
    }
}




