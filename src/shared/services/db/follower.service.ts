import { IFollowerData, IFollowerDocument } from '@followers/interfaces/follower.interface';
import { FollowerModel } from '@followers/models/follower.schema';
import { INotificationDocument, INotificationTemplate } from '@notifications/interfaces/notification.interface';
import { NotificationModel } from '@notifications/models/notification.schema';
import { notificationTemplate } from '@services/emails/templates/notification/notification-template';
import { emailQueue } from '@services/queues/email.queue';
import { UserCache } from '@services/redis/user.cache';
import { socketIONotificationObject } from '@socket/notification';
import { IUserDocument } from '@user/interfaces/user.interace';
import { UserModel } from '@user/models/user.schema';
import { ObjectId } from 'mongodb';
import mongoose, { Query, mongo, Document } from 'mongoose';

const userCache: UserCache = new UserCache();
class FollowerService {
  public async addFollowerToDB(userId: string, followeeId: string, username: string, followerDocumentId: ObjectId): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const followerObjectId: ObjectId = new mongoose.Types.ObjectId(userId);

    const following: IFollowerDocument = await FollowerModel.create({
      _id: followerDocumentId,
      followeeId: followeeObjectId,
      followerId: followerObjectId
    });

    const users: Promise<mongoose.mongo.BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: { $inc: { followingCount: 1 } }
        }
      },
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followersCount: 1 } }
        }
      }
    ]);

    const response: [mongoose.mongo.BulkWriteResult, IUserDocument | null] = await Promise.all([
      users,
      UserModel.findOne({ _id: followeeId })
    ]);
    const user: IUserDocument = (await userCache.getUserFromCache(followeeId)) as IUserDocument;
    if (response[1]?.notifications.follows && userId !== followeeId) {
      const notificationModel: INotificationDocument = new NotificationModel();
      const notifications = await notificationModel.insertNotification({
        userFrom: userId,
        userTo: followeeId,
        message: `${username} is following you`,
        notificationType: 'follows',
        entityId: new mongoose.Types.ObjectId(userId),
        createdItemId: new mongoose.Types.ObjectId(following._id),
        createdAt: new Date(),
        comment: '',
        post: '',
        reaction: '',
        imgId: '',
        imgVersion: '',
        gifUrl: ''
      });
      socketIONotificationObject.emit('insert notification', notifications, { followeeId });
      const templateParams: INotificationTemplate = {
        username: response[1].username!,
        message: `${username} is now following you`,
        header: 'Follower notification'
      };
      const template: string = notificationTemplate.notificationTemplate(templateParams);
      emailQueue.addEmailJob('followersEmail', { receiverEmail: user.email!, template, subject: `${username} is now following you` });
    }
  }

  public async removeFollowerFromDB(followeeId: string, followerId: string): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const followerObjectId: ObjectId = new mongoose.Types.ObjectId(followerId);

    const unfollow: Query<mongo.DeleteResult, Document<unknown, object, IFollowerDocument>> = FollowerModel.deleteOne({
      followeeId: followeeObjectId,
      followerId: followerObjectId
    });

    const users: Promise<mongoose.mongo.BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: followerId },
          update: { $inc: { followingCount: -1 } }
        }
      },
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followersCount: -1 } }
        }
      }
    ]);

    await Promise.all([unfollow, users]);
  }

  public async getFolloweeData(userObjectId: ObjectId): Promise<IFollowerData[]> {
    const data: IFollowerData[] = await FollowerModel.aggregate([
      { $match: { followerId: userObjectId } },
      { $lookup: { from: 'User', localField: 'followeeId', foreignField: '_id', as: 'followeeId' } },
      { $unwind: '$followeeId' },
      { $lookup: { from: 'Auth', localField: 'followeeId.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followeeId._id',
          usename: '$authId.username',
          avatarColor: '$authId.avatarColor',
          postCount: '$followeeId.postsCount',
          followersCount: '$followeeId.followersCount',
          followingCount: '$followeeId.followingCount',
          profilePicture: '$followeeId.profilePicture',
          uId: '$authId.uId',
          userProfile: '$followeeId'
        }
      },
      {
        $project: {
          followeeId: 0,
          followerId: 0,
          createdAt: 0,
          __v: 0,
          authId: 0
        }
      }
    ]);

    return data;
  }

  public async getFollowerData(userObjectId: ObjectId): Promise<IFollowerData[]> {
    const data: IFollowerData[] = await FollowerModel.aggregate([
      { $match: { followeeId: userObjectId } },
      { $lookup: { from: 'User', localField: 'followerId', foreignField: '_id', as: 'followerId' } },
      { $unwind: '$followerId' },
      { $lookup: { from: 'Auth', localField: 'followerId.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followerId._id',
          usename: '$authId.username',
          avatarColor: '$authId.avatarColor',
          postCount: '$followerId.postsCount',
          followersCount: '$followerId.followersCount',
          followingCount: '$followerId.followingCount',
          profilePicture: '$followerId.profilePicture',
          uId: '$authId.uId',
          userProfile: '$followerId'
        }
      },
      {
        $project: {
          followeeId: 0,
          followerId: 0,
          createdAt: 0,
          __v: 0,
          authId: 0
        }
      }
    ]);

    return data;
  }
}

export const followerService: FollowerService = new FollowerService();
