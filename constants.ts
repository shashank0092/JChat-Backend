export const ChatEventEnum=Object.freeze({
    CONNECTED_EVENT:"connected",
    DISCONNECT_EVENT:"disconnect",
    JOIN_CHAT_EVENT:"joinChat",
    LEAVE_CHAT_EVENT:"leavechat",
    UPDATE_GROUP_NAME_EVENT:"updateGroupName",
    MESSAGE_RECEIVED_EVENT:"messageRecived",
    NEW_CHAT_EVENT:"newChat",
    SOCKET_ERROR_EVENT:"socketError",
    STOP_TYPING_EVENT:"stopTyping",
    TYPING_EVENT:"typing"

})


export const AvailableChatEvents=Object.values(ChatEventEnum)