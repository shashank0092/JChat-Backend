import {Router} from "express"
import { SearchUser,CreateAndGetOneOnOneChat,GetAllChat } from "../../controllers/chat/chat.controllers"
import {verifyJWT} from "../../middleware/auth.middlewares"
const ChatRouter=Router()

ChatRouter.use(verifyJWT as any)


ChatRouter.route("/").get(GetAllChat as any)
ChatRouter.route("/serch_users").post(SearchUser)
ChatRouter.route("/create_one_chat").post(CreateAndGetOneOnOneChat)

export default ChatRouter