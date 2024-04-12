import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';

import { MessageCache } from '@services/redis/message.cache';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { chatQueue } from '@services/queues/chat.queue';
import { socketIOChatObject } from '@socket/chat';

const messageCache: MessageCache = new MessageCache();

export class Message {
  public async reaction(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId, reaction, type } = req.body as {
      conversationId: string;
      messageId: string;
      reaction: string;
      type: 'add' | 'remove';
    };
    const updatedMessage: IMessageData = await messageCache.updateMessageReaction(
      conversationId,
      messageId,
      reaction,
      `${req.currentUser?.username}`,
      type
    );
    socketIOChatObject.emit('message reaction', updatedMessage);

    chatQueue.addChatJob('updateMessageReaction', {
      messageId: new ObjectId(messageId),
      senderName: `${req.currentUser?.username}`,
      type,
      reaction
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message reaction added' });
  }
}
