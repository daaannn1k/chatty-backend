import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';

import { MessageCache } from '@services/redis/message.cache';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { chatService } from '@services/db/chat.service';

const messageCache: MessageCache = new MessageCache();

export class Get {
  public async conversationList(req: Request, res: Response): Promise<void> {
    let list: IMessageData[] = [];
    const cachedMessages: IMessageData[] = await messageCache.getUserConversationList(`${req.currentUser!.userId}`);

    if (cachedMessages.length) {
      list = cachedMessages;
    } else {
      list = await chatService.getUserConversationListFromDB(new ObjectId(req.currentUser!.userId));
    }
    res.status(HTTP_STATUS.OK).json({ message: 'User conversation list', list });
  }

  public async getChatMessages(req: Request, res: Response): Promise<void> {
    const { receiverId } = req.params;
    let messages: IMessageData[] = [];
    const cachedMessages: IMessageData[] = await messageCache.getChatMessagesFromCache(`${req.currentUser!.userId}`, `${receiverId}`);

    if (cachedMessages.length) {
      messages = cachedMessages;
    } else {
      messages = await chatService.getChatMessagesFromDB(new ObjectId(req.currentUser!.userId), new ObjectId(receiverId), { createdAt: 1 });
    }
    res.status(HTTP_STATUS.OK).json({ message: 'User chat messages', messages });
  }
}
