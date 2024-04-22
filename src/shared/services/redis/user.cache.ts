import Logger from 'bunyan';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { indexOf, findIndex } from 'lodash';

import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { BaseCache } from '@services/redis/base.cache';
import { INotificationSettings, ISocialLinks, IUserDocument } from '@user/interfaces/user.interace';

const log: Logger = config.createLogger('userCache');
type UserItem = string | ISocialLinks | INotificationSettings;
type UserCacheMultiType = string | string[] | number | Buffer | RedisCommandRawReply[] | IUserDocument | IUserDocument[];

export class UserCache extends BaseCache {
  constructor() {
    super('userCache');
  }

  public async saveUserToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser;

    const dataToSave = {
      _id: `${_id}`,
      uId: `${uId}`,
      username: `${username}`,
      email: `${email}`,
      avatarColor: `${avatarColor}`,
      createdAt: `${createdAt}`,
      postsCount: `${postsCount}`,
      blocked: JSON.stringify(blocked),
      blockedBy: JSON.stringify(blockedBy),
      profilePicture: `${profilePicture}`,
      followersCount: `${followersCount}`,
      followingCount: `${followingCount}`,
      notifications: JSON.stringify(notifications),
      social: JSON.stringify(social),
      work: `${work}`,
      location: `${location}`,
      school: `${school}`,
      quote: `${quote}`,
      bgImageId: `${bgImageId}`,
      bgImageVersion: `${bgImageVersion}`
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`users:${key}`, `${itemKey}`, `${itemValue}`);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: IUserDocument = (await this.client.HGETALL(`users:${userId}`)) as unknown as IUserDocument;
      const formattedResponse: IUserDocument = Helpers.formatObject(response);
      formattedResponse.createdAt = new Date(`${formattedResponse.createdAt}`);
      formattedResponse.uId = response.uId;

      return formattedResponse;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async updateSingleUserItemInCache(key: string, prop: string, value: UserItem): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.HSET(`users:${key}`, prop, JSON.stringify(value));
      const user: IUserDocument | null = await this.getUserFromCache(key);
      return user;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getUsersFromCache(start: number, end: number, excludedUserKey: string): Promise<IUserDocument[] | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const cachedUsers: string[] = await this.client.ZRANGE('user', start, end, { REV: true });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const users: IUserDocument[] = [];

      for (const key of cachedUsers) {
        if (key !== excludedUserKey) {
          multi.HGETALL(`users:${key}`);
        }
      }

      const response: UserCacheMultiType = (await multi.exec()) as UserCacheMultiType;

      for (const reply of response as IUserDocument[]) {
        const formattedResponse: IUserDocument = Helpers.formatObject(reply);
        formattedResponse.createdAt = new Date(`${formattedResponse.createdAt}`);
        formattedResponse.uId = reply.uId;
        users.push(formattedResponse);
      }

      return users;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getRandomUsersFromCache(userId: string, excludedUsername: string): Promise<IUserDocument[] | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const replies: IUserDocument[] = [];
      const followers: string[] = await this.client.LRANGE(`followers:${userId}`, 0, -1);
      const users: string[] = await this.client.ZRANGE('user', 0, -1);
      const randomUsers: string[] = Helpers.shuffle(users).slice(0, 10);

      for (const key of randomUsers) {
        const followerIndex = indexOf(followers, key);
        if (followerIndex < 0) {
          const userHash = (await this.client.HGETALL(`users:${key}`)) as unknown as IUserDocument;
          const parsedUser: IUserDocument = Helpers.formatObject(userHash);
          parsedUser.uId = JSON.stringify(userHash.uId);
          parsedUser.createdAt = new Date(`${parsedUser.createdAt}`);
          replies.push(parsedUser);
        }
      }

      const excludedUsernameIndex: number = findIndex(replies, ['username', excludedUsername]);
      replies.splice(excludedUsernameIndex, 1);
      return replies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getTotalUsersFromCache(userId?: string): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const totalCachedUsers: string[] = (await this.client.ZRANGE('user', 0, -1)).filter((id: string) => id !== userId);
      return totalCachedUsers.length;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
