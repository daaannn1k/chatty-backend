import { Request, Response } from 'express';
import { authUserPayload2 } from '@root/mocks/auth.mock';
import { followersMockRequest, followersMockResponse } from '@root/mocks/followers.mock';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';
import { followerQueue } from '@services/queues/follower.queue';
import { FollowersCache } from '@services/redis/follower.cache';
import { Remove } from '@followers/controllers/unfollow-user';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/follower.cache');

describe('Remove', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should send correct json response', async () => {
    const req: Request = followersMockRequest({}, authUserPayload2, {
      followerId: `${mergedAuthAndUserData._id}`,
      followeeId: '6064861bc25eaa5a5d2f9bf4'
    }) as Request;
    const res: Response = followersMockResponse();
    jest.spyOn(FollowersCache.prototype, 'removeFollowerFromCache');
    jest.spyOn(FollowersCache.prototype, 'updateFollowersCountInCache');
    jest.spyOn(followerQueue, 'addFollowerJob');

    await Remove.prototype.follower(req, res);
    expect(FollowersCache.prototype.removeFollowerFromCache).toHaveBeenCalledTimes(2);
    expect(FollowersCache.prototype.removeFollowerFromCache).toHaveBeenCalledWith(
      `following:${req.params.followerId}`,
      req.params.followeeId
    );
    expect(FollowersCache.prototype.removeFollowerFromCache).toHaveBeenCalledWith(
      `followers:${req.params.followeeId}`,
      req.params.followerId
    );
    expect(FollowersCache.prototype.updateFollowersCountInCache).toHaveBeenCalledTimes(2);
    expect(FollowersCache.prototype.updateFollowersCountInCache).toHaveBeenCalledWith(`${req.params.followeeId}`, 'followersCount', -1);
    expect(FollowersCache.prototype.updateFollowersCountInCache).toHaveBeenCalledWith(`${req.params.followerId}`, 'followingCount', -1);
    expect(followerQueue.addFollowerJob).toHaveBeenCalledWith('removeFollowerFromDB', {
      keyOne: `${req.params.followeeId}`,
      keyTwo: `${req.params.followerId}`
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unfollowed user now'
    });
  });
});
