import {Router} from "express"
import { SearchUser,CreateAndGetOneOnOneChat,GetAllChat } from "../../controllers/chat/chat.controllers"
import {verifyJWT} from "../../middleware/auth.middlewares"
const ChatRouter=Router()

ChatRouter.use(verifyJWT)

ChatRouter.route("/").get(GetAllChat)
ChatRouter.route("/serch_users").post(SearchUser)
ChatRouter.route("/create_one_chat").post(CreateAndGetOneOnOneChat)

export default ChatRouter