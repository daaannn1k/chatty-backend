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
    const firstList: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`
    ];
    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social)
    ];
    const thirdList: string[] = [
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'bgImageId',
      `${bgImageId}`,
      'bgImageVersion',
      `${bgImageVersion}`
    ];

    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });
      await this.client.HSET(`users:${key}`, dataToSave);
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

// response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));
//       response.uId = Helpers.parseJson(`${response.uId}`);
//       response.followersCount = Helpers.parseJson(`${response.followersCount}`);
//       response.followingCount = Helpers.parseJson(`${response.followingCount}`);
//       response.social = Helpers.parseJson(`${response.social}`);
//       response.school = Helpers.parseJson(`${response.school}`);
//       response.email = Helpers.parseJson(`${response.email}`);
//       response.notifications = Helpers.parseJson(`${response.notifications}`);
//       response.avatarColor = Helpers.parseJson(`${response.avatarColor}`);
//       response.bgImageId = Helpers.parseJson(`${response.bgImageId}`);
//       response.blocked = Helpers.parseJson(`${response.blocked}`);
//       response.blockedBy = Helpers.parseJson(`${response.blockedBy}`);
//       response.bgImageVersion = Helpers.parseJson(`${response.bgImageVersion}`);
//       response.work = Helpers.parseJson(`${response.work}`);
//       response.username = Helpers.parseJson(`${response.username}`);
//       response.profilePicture = Helpers.parseJson(`${response.profilePicture}`);
//       response._id = Helpers.parseJson(`${response._id}`);
//       response.postsCount = Helpers.parseJson(`${response.postsCount}`);
//       response.location = Helpers.parseJson(`${response.location}`);
//       response.quote = Helpers.parseJson(`${response.quote}`);
