import {Router} from "express"
import {SendMessage, getAllMessage} from "../../controllers/message/message.controller"
import { verifyJWT } from "../../middleware/auth.middlewares"
import { upload } from "../../middleware/multer.middleware"
const MessageRouter=Router()

MessageRouter.use(verifyJWT as any)
MessageRouter.route("/sendMessage/:chatId").post(upload.fields([{name:"attachments",maxCount:5}])as any,SendMessage as any)
MessageRouter.route("/getMessages/:chatId").get(getAllMessage as any)


export default MessageRouter