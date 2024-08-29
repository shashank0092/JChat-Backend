import cron from "node-cron"
import { chatMessage } from "../models/message/message.model"
import { getSignedUrl } from "@aws-sdk/cloudfront-signer"
import dotenv from "dotenv"
import { user } from "../models/user/user.model"


dotenv.config({
    path: "./.env"
})

const UpdateUrl = async () => {

    const CURRENT_TIME = new Date()

    const twentyFourHoursAgo = new Date(CURRENT_TIME.getTime() - 360 * 60 * 60 * 1000);
    // const fortyEightHoursAgo = new Date(CURRENT_TIME.getTime() - 360 * 60 * 60 * 1000);
    const ALL_CHATS = await chatMessage.find(
        { "mediaLink.updatedAt": { $gt: twentyFourHoursAgo } }
    )
    const ALL_USERS = await user.find(
        { "mediaLink.updatedAt": { $gt: twentyFourHoursAgo } }
    )
    console.log(ALL_USERS)

    for (let i = 0; i < ALL_USERS.length; i++) {
        // console.log(ALL_CHATS[i],`this is ${i} index of chat`)
        const ATTCHED_FILES = ALL_USERS[i].attachment;

        const UPDATE_USER_MEDIA = getSignedUrl({
            url: `https://d2mhnmhkxs9bvr.cloudfront.net/${ATTCHED_FILES.url}`,
            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            privateKey: process.env.CLOUD_FRONT_KEY_PRIVATE_KEY,
            keyPairId: process.env.CLOUD_FRONT_KEY_PAIR_ID
        })

        console.log(UPDATE_USER_MEDIA,"THIS IS UR")
        console.log(UPDATE_USER_MEDIA,"ATT")

        const CHANGE_user_db=await user.findOneAndUpdate({
            _id:ALL_USERS[i]._id,
            
        })
    }

    // for (let i = 0; i < ALL_CHATS.length; i++) {
    //     // console.log(ALL_CHATS[i],`this is ${i} index of chat`)
    //     const ATTCHED_FILES = ALL_CHATS[i].attachments;

    //     if (ATTCHED_FILES.length > 0) {
    //         const UPDATED_FILE_LINK = ATTCHED_FILES.map((media) => {
    //             try {
    //                 const url = getSignedUrl({
    //                     url: `https://d2mhnmhkxs9bvr.cloudfront.net/${media.url}`,
    //                     dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    //                     privateKey: process.env.CLOUD_FRONT_KEY_PRIVATE_KEY,
    //                     keyPairId: process.env.CLOUD_FRONT_KEY_PAIR_ID
    //                 })
    //                 console.log(media.url, "this is url")
    //                 console.log(url, "this is updated url")
    //                 return {
    //                     url: url,
    //                 }
    //             }
    //             catch (err) {
    //                 console.log(err, "this is erorr")
    //             }
    //         })

    //         ALL_CHATS[i].mediaLink[0].url = UPDATED_FILE_LINK[0].url
    //         console.log("update sucess")
    //     }
    // }
}

// cron.schedule("*/3 * * * * *",UpdateUrl)