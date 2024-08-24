import {Router} from "express"
import {SendMessage, getAllMessage} from "../../controllers/message/message.controller"
import { verifyJWT } from "../../middleware/auth.middlewares"
import { ImageUploader } from "../../middleware/multer.middleware"
import multer from "multer"


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const MessageRouter=Router()

MessageRouter.use(verifyJWT as any)
MessageRouter.route("/sendMessage/:chatId").post(upload.fields([{name:"attachments",maxCount:5}])as any,ImageUploader("media"),SendMessage as any)
MessageRouter.route("/getMessages/:chatId").get(getAllMessage as any)


export default MessageRouter