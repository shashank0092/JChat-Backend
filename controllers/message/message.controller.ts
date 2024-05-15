import { Request, Response } from "express";
import { chat } from "../../models/chat/chat.model";
import { chatMessage } from "../../models/message/message.model";
import mongoose from "mongoose";
import { emitSocketEvent } from "../../socket";
import { ChatEventEnum } from "../../constants";
import { CustomeRequest } from "../../types/ReqUserObject";
import { user } from "../../models/user/user.model";

/**
 * @description Utility function which returns the pipeline stages to structure the chat message schema with common lookups
 * @returns {mongoose.PipelineStage[]}
 */
const chatMessageCommonAggregation = () => {
  return [
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "sender",
        as: "sender",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        sender: { $first: "$sender" },
      },
    },
  ];
};

const SendMessage = async (req: CustomeRequest, res: Response) => {
  const { chatId, content } = req.body;
  // console.log(req.user,"thsi sis usrr")

  if (!content) {
    return res.json({ message: "Please Share some content" }).status(404);
  }

  const selectedChat = await chat.findById(chatId);

  if (!selectedChat) {
    return res.json({ message: "Chat doesn't exist" }).status(404);
  }

  const message = await chatMessage.create({
    sender: new mongoose.Types.ObjectId((req as any)?.user._id),
    content: content || "",
    chat: new mongoose.Types.ObjectId(chatId),
    attachments: null,
  });

  const Chat = await chat.findByIdAndUpdate(chatId, {
    $set: { lastMessage: message._id },
  });
  const messages = await chatMessage.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(message._id),
      },
    },
    ...chatMessageCommonAggregation(),
  ]);

  // console.log(Chat,"this is chat object")
  const recviedMessage = messages[0];

  if (!recviedMessage) {
    return res.json({ message: "Internal Server Error" }).status(500);
  }


  selectedChat.participants.forEach(async (participant) => {
    if (participant.toString() == req.user.email) return;
    const recvierIdObject = await user
      .findOne({ email: participant })
      .select("_id");
      console.log(recvierIdObject,"this isan")
    const recvierId =await JSON.stringify(recvierIdObject?._id).replace(/"/g, '')
    
    console.log(recvierId,"this is recvier id")
    if (recvierId) {

      console.log(recvierId,"this is an id inside block")
      emitSocketEvent(
        req,
        recvierId,
        // "663f4a7129b8e83374385f81",
        ChatEventEnum.MESSAGE_RECEIVED_EVENT,
        recviedMessage
      );
    }
  });

  

  return res
    .json({ message: "Message saved successfully", data: recviedMessage })
    .status(201);
};

export { SendMessage };
