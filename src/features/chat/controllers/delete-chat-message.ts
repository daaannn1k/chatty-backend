import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { MessageCache } from '@services/redis/message.cache';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { chatQueue } from '@services/queues/chat.queue';
import { socketIOChatObject } from '@socket/chat';
import mongoose from 'mongoose';

const messageCache: MessageCache = new MessageCache();

export class Delete {
  public async markMessageAsDeleted(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId, messageId, type } = req.params;
    const message: IMessageData = await messageCache.markMessageAsDeleted(senderId, receiverId, messageId, type);
    socketIOChatObject.emit('message read', message);
    socketIOChatObject.emit('chat list', message);
    chatQueue.addChatJob('markMessageAsDeleted', { messageId: new mongoose.Types.ObjectId(messageId), type });

    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as deleted' });
  }
}
