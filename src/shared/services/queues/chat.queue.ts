import { IChatJobData, IMessageData } from '@chat/interfaces/chat.interface';
import { BaseQueue } from './base.queue';
import { chatWorker } from '@workers/chat.worker';

class ChatQueue extends BaseQueue {
  constructor() {
    super('chats');
    this.processJob('addChatMessageToDB', 5, chatWorker.addChatMessageToDB);
    this.processJob('markMessageAsDeleted', 5, chatWorker.markMessageAsDeleted);
    this.processJob('markMessagesAsRead', 5, chatWorker.markMessagesAsRead);
    this.processJob('updateMessageReaction', 5, chatWorker.updateMessageReaction);
  }

  public addChatJob(name: string, data: IChatJobData | IMessageData): void {
    this.addJob(name, data);
  }
}

export const chatQueue: ChatQueue = new ChatQueue();
