import { IBasicInfo, INotificationSettings, ISearchUser, ISocialLinks, IUserDocument } from '@user/interfaces/user.interace';
import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';
import { followerService } from './follower.service';
import { indexOf } from 'lodash';
import { AuthModel } from '@auth/models/auth.schema';

class UserService {
  public async addUserData(user: IUserDocument): Promise<void> {
    await UserModel.create(user);
  }

  public async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const user = (await UserModel.findOne({ _id: userId }).exec()) as unknown as IUserDocument;
    if (user) {
      await AuthModel.updateOne({ _id: user.authId }, { $set: { password: hashedPassword } });
    }
  }

  public async updateUserInfo(userId: string, info: IBasicInfo): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { work: info.work, school: info.school, quote: info.quote, location: info.location } }
    ).exec();
  }

  public async updateSocialLinks(userId: string, links: ISocialLinks): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { social: links } }).exec();
  }

  public async updateNotificationSettings(userId: string, notifications: INotificationSettings): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { notifications } }).exec();
  }

  public async getUserById(userId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);

    return users[0];
  }

  public async getAllUsers(userId: string, skip = 0, limit = 0): Promise<IUserDocument[]> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() },
      { $sort: { createdAt: -1 } }
    ]);

    return users;
  }

  public async getAllUsersInDB(userId?: string): Promise<number> {
    const total: number = await UserModel.find({ _id: { $ne: new mongoose.Types.ObjectId(userId) } }).countDocuments();
    return total;
  }

  public async getUserByAuthId(authId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);

    return users[0];
  }

  public async getRandomUsers(userId: string): Promise<IUserDocument[]> {
    const response: IUserDocument[] = [];
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $sample: { size: 10 } },
      {
        $addFields: {
          username: '$authId.username',
          email: '$authId.email',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          createdAt: '$authId.createdAt'
        }
      },
      {
        $project: {
          authId: 0,
          __v: 0
        }
      }
    ]);

    const followers: string[] = await followerService.getFolloweesIds(`${userId}`);

    for (const user of users) {
      const userIndex = indexOf(followers, user._id.toString());

      if (userIndex < 0) {
        response.push(user);
      }
    }

    return response;
  }

  public async searchUsers(regex: RegExp): Promise<ISearchUser[]> {
    const response: ISearchUser[] = await AuthModel.aggregate([
      { $match: { username: regex } },
      { $lookup: { from: 'User', localField: '_id', foreignField: 'authId', as: 'userId' } },
      { $unwind: '$userId' },
      {
        $project: {
          _id: '$userId._id',
          profilePicture: '$userId.profilePicture',
          avatarColor: 1,
          email: 1,
          username: 1
        }
      }
    ]);

    return response;
  }

  private aggregateProject() {
    return {
      _id: 1,
      username: '$authId.username',
      uId: '$authId.uId',
      email: '$authId.email',
      avatarColor: '$authId.avatarColor',
      createdAt: '$authId.createdAt',
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      profilePicture: 1
    };
  }
}

export const userService: UserService = new UserService();
