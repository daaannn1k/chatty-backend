import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { BaseCache } from '@services/redis/base.cache';
import { IUserDocument } from '@user/interfaces/user.interace';
import Logger from 'bunyan';

const log: Logger = config.createLogger('userCache');

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
      '_id':`${_id}`,
      'uId':`${uId}`,
      'username':`${username}`,
      'email':`${email}`,
      'avatarColor':`${avatarColor}`,
      'createdAt':`${createdAt}`,
      'postsCount':`${postsCount}`,
      'blocked':JSON.stringify(blocked),
      'blockedBy':JSON.stringify(blockedBy),
      'profilePicture':`${profilePicture}`,
      'followersCount':`${followersCount}`,
      'followingCount':`${followingCount}`,
      'notifications':JSON.stringify(notifications),
      'social':JSON.stringify(social),
      'work':`${work}`,
      'location':`${location}`,
      'school':`${school}`,
      'quote':`${quote}`,
      'bgImageId':`${bgImageId}`,
      'bgImageVersion':`${bgImageVersion}`
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });
      for(const [itemKey, itemValue] of Object.entries(dataToSave)) {
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
      console.log('RESPONSE', response);
      const formattedResponse: IUserDocument = Helpers.formatObject(response);
      formattedResponse.createdAt = new Date(`${formattedResponse.createdAt}`);
      formattedResponse.uId = response.uId;

      return formattedResponse;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}

