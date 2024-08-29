import { Request, Response } from "express";
import { chat } from "../../models/chat/chat.model";
import { chatMessage } from "../../models/message/message.model";
import mongoose from "mongoose";
import { emitSocketEvent } from "../../socket";
import { ChatEventEnum } from "../../constants";
import { CustomeRequest } from "../../types/ReqUserObject";
import { user } from "../../models/user/user.model";
import { ApiResponse } from "../../util/ApiResponse";
import { getLocalPath, getStaticFilePath } from "../../util/helper";
import { MessageFileType } from "../../types/FileType"
import { getSignedUrl } from "@aws-sdk/cloudfront-signer"
import dotenv from "dotenv"


dotenv.config({
  path: "./.env"
})
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
  console.log("this is running for sending message image for app")
  const { chatId } = req.params
  const { content } = req.body;

  console.log(content, "this is con")

  if (!content && !((req as any).files?.attachments?.length)) {
    return res.json({ message: "Please Share some content" }).status(404);
  }

  const selectedChat = await chat.findById(chatId);
  console.log(selectedChat, "this is all selected chat")
  if (!selectedChat) {
    return res.json({ message: "Chat doesn't exist" }).status(404);
  }

  let mediaLink;

  if (req?.uploadedKeys?.length > 0) {
    mediaLink = req.uploadedKeys.map((media) => {
      const url = getSignedUrl({
        url: `https://d2mhnmhkxs9bvr.cloudfront.net/${media.url}`,
        dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString(),
        privateKey: process.env.CLOUD_FRONT_KEY_PRIVATE_KEY,
        keyPairId: process.env.CLOUD_FRONT_KEY_PAIR_ID
      })

      return {
        url: url,
        type: media.type,
        name: media.name,
        size: media.size
      }

    })
  }


  const message = await chatMessage.create({
    sender: new mongoose.Types.ObjectId(req.user._id),
    content: content || "",
    chat: new mongoose.Types.ObjectId(chatId),
    attachments: req.uploadedKeys,
    mediaLink: mediaLink
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

  const recviedMessage = messages[0];

  if (!recviedMessage) {
    return res.json({ message: "Internal Server Error" }).status(500);
  }


  selectedChat.participants.forEach(async (participant) => {
    if (participant.toString() == req.user.email) return;
    const recvierIdObject = await user
      .findOne({ email: participant })
      .select("_id");

    const recvierId = await JSON.stringify(recvierIdObject?._id).replace(/"/g, '')


    if (recvierId) {
      emitSocketEvent(
        req,
        recvierId,
        ChatEventEnum.MESSAGE_RECEIVED_EVENT,
        recviedMessage
      );
    }
  });

  return res.status(200)
    .json(new ApiResponse(200, { data: recviedMessage }, "Message saved successfully"))
};


const getAllMessage = async (req: CustomeRequest, res: Response) => {
  console.log("runnin get all message route")
  const { chatId } = req.params

  const selectedChat = await chat.findById(chatId)

  if (!selectedChat) {
    return res.json({ message: "Chat is not avlaible" }).status(404)
  }

  const messages = await chatMessage.aggregate(
    [
      {
        $match: {
          chat: new mongoose.Types.ObjectId(chatId)
        }
      },
      ...chatMessageCommonAggregation(),
      //  {
      //   $sort:{
      //     createdAt: -1,
      //   }
      //  }
    ]
  )

  return res.status(200)
    .json(new ApiResponse(200, { data: messages }, "Message Recived Succesfully"))


}

export { SendMessage, getAllMessage };
