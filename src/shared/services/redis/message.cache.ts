import Logger from 'bunyan';
import { find, findIndex, remove } from 'lodash';

import { config } from '@root/config';
import { BaseCache } from '@services/redis/base.cache';
import { ServerError } from '@global/helpers/error-handler';
import { IChatList, IChatUsers, IGetMessageFromCache, IMessageData } from '@chat/interfaces/chat.interface';
import { Helpers } from '@global/helpers/helpers';
import { IReaction } from '@reactions/interfaces/reaction.interface';

const log: Logger = config.createLogger('messageCache');

export class MessageCache extends BaseCache {
  constructor() {
    super('messageCache');
  }

  public async addChatListToCache(senderId: string, receiverId: string, conversationId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      if (!userChatList.length) {
        await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
      } else {
        const receiverIndex: number = findIndex(userChatList, (item: string) => item.includes(receiverId));
        if (receiverIndex < 0) {
          await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
        }
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async addChatMessageToCache(conversationId: string, messageData: IMessageData): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.RPUSH(`messages:${conversationId}`, JSON.stringify(messageData));
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async addChatUsersToCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const users: IChatUsers[] = await this.getChatUsersList();
      const usersIndex: number = findIndex(users, (item: IChatUsers) => JSON.stringify(item) === JSON.stringify(value));
      let chatUsers: IChatUsers[] = [];
      if (usersIndex < 0) {
        await this.client.RPUSH('chatUsers', JSON.stringify(value));
        chatUsers = await this.getChatUsersList();
      } else {
        chatUsers = users;
      }
      return chatUsers;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async removeChatUsersFromCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const users: IChatUsers[] = await this.getChatUsersList();
      const usersIndex: number = findIndex(users, (item: IChatUsers) => JSON.stringify(item) === JSON.stringify(value));
      let chatUsers: IChatUsers[] = [];
      if (usersIndex >= 0) {
        await this.client.LREM('chatUsers', 1, JSON.stringify(value));
        chatUsers = await this.getChatUsersList();
      } else {
        chatUsers = users;
      }
      return chatUsers;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getUserConversationList(key: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList: string[] = await this.client.LRANGE(`chatList:${key}`, 0, -1);
      const conversationChatList: IMessageData[] = [];

      for (const item of userChatList) {
        const parsedItem: IChatList = Helpers.parseJson(item) as IChatList;
        const lastMessage: string = (await this.client.LINDEX(`messages:${parsedItem.conversationId}`, -1)) as string;
        const parsedMessage: IMessageData = Helpers.parseJson(lastMessage) as IMessageData;
        conversationChatList.push(parsedMessage);
      }

      return conversationChatList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getChatMessagesFromCache(senderId: string, receiverId: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      const receiver: string = find(userChatList, (item: string) => item.includes(receiverId)) as string;
      const parsedReceiver: IChatList = Helpers.parseJson(receiver);

      if (parsedReceiver) {
        const cachedMessages: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, -1);
        const chatMessages: IMessageData[] = [];
        for (const item of cachedMessages) {
          const parsedMessage: IMessageData = Helpers.parseJson(item);
          chatMessages.push(parsedMessage);
        }
        return chatMessages;
      } else {
        return [];
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async markMessageAsDeleted(senderId: string, receiverId: string, messageId: string, type: string): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const { index, message, receiver } = await this.getMessage(senderId, receiverId, messageId);
      const chatMessage: IMessageData = Helpers.parseJson(message);

      if (type === 'deleteForMe') {
        chatMessage.deleteForMe = true;
      } else {
        chatMessage.deleteForMe = true;
        chatMessage.deleteForEveryone = true;
      }

      await this.client.LSET(`messages:${receiver.conversationId}`, index, JSON.stringify(chatMessage));
      const response: string = (await this.client.LINDEX(`messages:${receiver.conversationId}`, index)) as string;
      return Helpers.parseJson(response) as IMessageData;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async updateChatMessages(senderId: string, receiverId: string): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      const receiver: string = find(userChatList, (item: string) => item.includes(receiverId)) as string;
      const parsedReceiver: IChatList = Helpers.parseJson(receiver);
      const cachedMessages: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, -1);

      for (const [index, item] of cachedMessages.entries()) {
        const parsedMessage: IMessageData = Helpers.parseJson(item);
        if (!parsedMessage.isRead) {
          parsedMessage.isRead = true;
          await this.client.LSET(`messages:${parsedReceiver.conversationId}`, index, JSON.stringify(parsedMessage));
        }
      }

      const response: string = (await this.client.LINDEX(`messages:${parsedReceiver.conversationId}`, -1)) as string;
      return Helpers.parseJson(response) as IMessageData;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async updateMessageReaction(
    conversationId: string,
    messageId: string,
    reaction: string,
    senderName: string,
    type: 'add' | 'remove'
  ): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const messages: string[] = await this.client.LRANGE(`messages:${conversationId}`, 0, -1);
      const cachedMessage: string = find(messages, (item: string) => item.includes(messageId)) as string;
      const cachedMessageIndex: number = findIndex(messages, (item: string) => item.includes(messageId));
      const parsedMessage: IMessageData = Helpers.parseJson(cachedMessage);
      const reactions: IReaction[] = [];

      if (parsedMessage) {
        remove(parsedMessage.reaction, (item: IReaction) => item.senderName === senderName);
        if (type === 'add') {
          reactions.push({ senderName, type: reaction });
          parsedMessage.reaction = [...parsedMessage.reaction, ...reactions];
          await this.client.LSET(`messages:${conversationId}`, cachedMessageIndex, JSON.stringify(parsedMessage));
        } else {
          await this.client.LSET(`messages:${conversationId}`, cachedMessageIndex, JSON.stringify(parsedMessage));
        }
      }

      const updatedMessage: string = (await this.client.LINDEX(`messages:${conversationId}`, cachedMessageIndex)) as string;
      return Helpers.parseJson(updatedMessage) as IMessageData;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  private async getChatUsersList(): Promise<IChatUsers[]> {
    const chatUsersList: IChatUsers[] = [];
    const chatUsers = await this.client.LRANGE('chatUsers', 0, -1);
    for (const item of chatUsers) {
      const chatUser: IChatUsers = Helpers.parseJson(item) as IChatUsers;
      chatUsersList.push(chatUser);
    }

    return chatUsersList;
  }

  private async getMessage(senderId: string, receiverId: string, messageId: string): Promise<IGetMessageFromCache> {
    const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
    const receiver: string = find(userChatList, (item: string) => item.includes(receiverId)) as string;
    const parsedReceiver: IChatList = Helpers.parseJson(receiver);
    const messages: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, -1);
    const message = find(messages, (item: string) => item.includes(messageId)) as string;
    const index: number = findIndex(messages, (item: string) => item.includes(messageId));
    return { index, message, receiver: parsedReceiver };
  }
}
