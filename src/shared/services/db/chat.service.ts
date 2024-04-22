import { ObjectId } from 'mongodb';

import { IMessageData } from '@chat/interfaces/chat.interface';
import { IConversationDocument } from '@chat/interfaces/conversation.interface';
import { MessageModel } from '@chat/models/chat.schema';
import { ConversationModel } from '@chat/models/converstaion.schema';

import mongoose from 'mongoose';

class ChatService {
  public async addMessageToDB(value: IMessageData): Promise<void> {
    const conversationData: IConversationDocument[] = await ConversationModel.find({ _id: value?.conversationId }).exec();

    if (!conversationData.length) {
      await ConversationModel.create({
        _id: value?.conversationId,
        senderId: new mongoose.Types.ObjectId(value.senderId),
        receiverId: new mongoose.Types.ObjectId(value.receiverId)
      });
    }

    await MessageModel.create({
      _id: value._id,
      conversationId: value.conversationId,
      receiverId: new mongoose.Types.ObjectId(value.receiverId),
      receiverUsername: value.receiverUsername,
      receiverAvatarColor: value.receiverAvatarColor,
      receiverProfilePicture: value.receiverProfilePicture,
      senderUsername: value.senderUsername,
      senderId: new mongoose.Types.ObjectId(value.senderId),
      senderAvatarColor: value.senderAvatarColor,
      senderProfilePicture: value.senderProfilePicture,
      body: value.body,
      isRead: value.isRead,
      gifUrl: value.gifUrl,
      selectedImage: value.selectedImage,
      reaction: value.reaction,
      createdAt: value.createdAt
    });
  }

  public async getUserConversationListFromDB(userId: ObjectId): Promise<IMessageData[]> {
    const messages: IMessageData[] = await MessageModel.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $group: { _id: '$conversationId', result: { $last: '$$ROOT' } } },
      {
        $project: {
          _id: '$result._id',
          conversationId: '$result.conversationId',
          receiverId: '$result.receiverId',
          receiverUsername: '$result.receiverUsername',
          receiverAvatarColor: '$result.receiverAvatarColor',
          receiverProfilePicture: '$result.receiverProfilePicture',
          senderUsername: '$result.senderUsername',
          senderId: '$result.senderId',
          senderAvatarColor: '$result.senderAvatarColor',
          senderProfilePicture: '$result.senderProfilePicture',
          body: '$result.body',
          isRead: '$result.isRead',
          gifUrl: '$result.gifUrl',
          selectedImage: '$result.selectedImage',
          reaction: '$result.reaction',
          createdAt: '$result.createdAt'
        }
      },
      { $sort: { createdAt: 1 } }
    ]);

    return messages;
  }

  public async getChatMessagesFromDB(senderId: ObjectId, receiverId: ObjectId, sort: Record<string, 1 | -1>): Promise<IMessageData[]> {
    const query = {
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    };
    const chatMessages: IMessageData[] = await MessageModel.aggregate([{ $match: query }, { $sort: sort }]);

    return chatMessages;
  }

  public async markMessageAsDeletedInDB(messageId: string, type: string): Promise<void> {
    if (type === 'deleteForMe') {
      await MessageModel.findOneAndUpdate({ _id: messageId }, { $set: { deleteForMe: true } }).exec();
    } else {
      await MessageModel.findOneAndUpdate({ _id: messageId }, { $set: { deleteForMe: true, deleteForEveryone: true } }).exec();
    }
  }

  public async markMessageAsReadInDB(senderId: ObjectId, receiverId: ObjectId): Promise<void> {
    const query = {
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ],
      $and: [{ isRead: false }]
    };
    await MessageModel.updateMany(query, { isRead: true });
  }

  public async updateMessageReactioninDB(messageId: ObjectId, senderName: string, reaction: string, type: 'add' | 'remove'): Promise<void> {
    if (type === 'add') {
      await MessageModel.updateOne(
        { _id: messageId },
        {
          $pull: { reaction: { senderName } }
        }
      ).exec();
      await MessageModel.updateOne(
        { _id: messageId },
        {
          $push: { reaction: { senderName, type: reaction } }
        }
      ).exec();
    } else {
      await MessageModel.updateOne({ _id: messageId }, { $pull: { reaction: { senderName } } }).exec();
    }
  }
}

export const chatService: ChatService = new ChatService();
