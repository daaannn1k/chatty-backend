import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { FollowersCache } from '@services/redis/follower.cache';
import { followerQueue } from '@services/queues/follower.queue';

const followerCache: FollowersCache = new FollowersCache();

export class Remove {
  public async follower(req: Request, res: Response): Promise<void> {
    const { followerId, followeeId } = req.params;
    const removeFolloweesFromCache: Promise<void> = followerCache.removeFollowerFromCache(
      `following:${req.currentUser!.userId}`,
      `${followeeId}`
    );
    const removeFollowerFromCache: Promise<void> = followerCache.removeFollowerFromCache(`followers:${followeeId}`, followerId);
    const followersCount: Promise<void> = followerCache.updateFollowersCountInCache(`${followeeId}`, 'followersCount', -1);
    const followeesCount: Promise<void> = followerCache.updateFollowersCountInCache(`${followerId}`, 'followingCount', -1);
    await Promise.all([removeFollowerFromCache, removeFolloweesFromCache, followersCount, followeesCount]);

    //to check!!!
    followerQueue.addFollowerJob('removeFollowerFromDB', {
      keyOne: `${followeeId}`,
      keyTwo: `${followerId}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Unfollowed user now' });
  }
}
