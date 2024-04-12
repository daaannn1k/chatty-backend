import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { UploadApiResponse } from 'cloudinary';
import HTTP_STATUS from 'http-status-codes';

import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interace';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { addChatSchema } from '@chat/schemes/chat';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { IChatUsers, IMessageData, IMessageNotification } from '@chat/interfaces/chat.interface';
import { socketIOChatObject } from '@socket/chat';
import { INotificationTemplate } from '@notifications/interfaces/notification.interface';
import { emailQueue } from '@services/queues/email.queue';
import { notificationTemplate } from '@services/emails/templates/notification/notification-template';
import { MessageCache } from '@services/redis/message.cache';
import { chatQueue } from '@services/queues/chat.queue';

const userCache: UserCache = new UserCache();
const messageCache: MessageCache = new MessageCache();

export class Add {
  @joiValidation(addChatSchema)
  public async message(req: Request, res: Response): Promise<void> {
    const {
      conversationId,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body,
      gifUrl,
      isRead,
      selectedImage
    } = req.body;
    let fileUrl = '';
    const messageObjectId: ObjectId = new ObjectId();
    const conversationObjectId: ObjectId = !conversationId ? new ObjectId() : new mongoose.Types.ObjectId(conversationId);
    const sender: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;

    if (selectedImage.length) {
      const result: UploadApiResponse = (await uploads(selectedImage)) as UploadApiResponse;

      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }

      fileUrl = `https://res.cloudinary.com/diwokovnd/image/upload/v${result.version}/${result.public_id}`;
    }

    //to check in the database if everything is fine
    const messageData: IMessageData = {
      _id: messageObjectId,
      conversationId: conversationObjectId,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      senderUsername: `${req.currentUser!.username}`,
      senderId: `${req.currentUser!.userId}`,
      senderAvatarColor: `${req.currentUser!.avatarColor}`,
      senderProfilePicture: `${sender.profilePicture}`,
      body,
      isRead,
      gifUrl,
      selectedImage: fileUrl,
      reaction: [],
      createdAt: new Date(),
      deleteForMe: false,
      deleteForEveryone: false
    };

    Add.prototype.emitIOSocketEvent(messageData);

    if (!isRead) {
      Add.prototype.messageNotification({
        currentUser: req.currentUser!,
        message: body,
        receiverName: receiverUsername,
        receiverId,
        messageData
      });
    }

    await messageCache.addChatListToCache(`${req.currentUser!.userId}`, `${receiverId}`, `${conversationObjectId}`);
    await messageCache.addChatListToCache(`${receiverId}`, `${req.currentUser!.userId}`, `${conversationObjectId}`);
    await messageCache.addChatMessageToCache(`${conversationObjectId}`, messageData);
    chatQueue.addChatJob('addChatMessageToDB', messageData);

    res.status(HTTP_STATUS.OK).json({ message: 'Message added', conversationId: conversationObjectId });
  }

  public async addChatUsers(req: Request, res: Response): Promise<void> {
    const chatUsers: IChatUsers[] = await messageCache.addChatUsersToCache(req.body);
    socketIOChatObject.emit('add chat users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users added' });
  }

  public async removeChatUsers(req: Request, res: Response): Promise<void> {
    const chatUsers: IChatUsers[] = await messageCache.removeChatUsersFromCache(req.body);
    socketIOChatObject.emit('add chat users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users removed' });
  }

  private emitIOSocketEvent(data: IMessageData): void {
    socketIOChatObject.emit('message received', data);
    socketIOChatObject.emit('chat list', data);
  }

  private async messageNotification({ currentUser, message, receiverName, receiverId }: IMessageNotification): Promise<void> {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${receiverId}`)) as IUserDocument;

    if (cachedUser.notifications.messages) {
      const templateParams: INotificationTemplate = {
        username: receiverName,
        message,
        header: `Message notification from ${currentUser.username}`
      };
      const template: string = notificationTemplate.notificationTemplate(templateParams);
      emailQueue.addEmailJob('directMessageEmail', {
        receiverEmail: cachedUser.email!,
        template,
        subject: `You've received a message from ${currentUser.username}`
      });
    }
  }
}
