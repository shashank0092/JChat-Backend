import {Router} from "express"
import {SendMessage} from "../../controllers/message/message.controller"
import { verifyJWT } from "../../middleware/auth.middlewares"
const MessageRouter=Router()

MessageRouter.use(verifyJWT as any)
MessageRouter.route("/sendMessage").post(SendMessage as any)


export default MessageRouter