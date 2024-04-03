import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload2 } from '@root/mocks/auth.mock';
import * as followerServer from '@socket/follower';
import { followersMockRequest, followersMockResponse } from '@root/mocks/followers.mock';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';
import { followerQueue } from '@services/queues/follower.queue';
import { Add } from '@followers/controllers/follower-user';
import { UserCache } from '@services/redis/user.cache';
import { FollowersCache } from '@services/redis/follower.cache';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/user.cache');
jest.mock('@services/redis/follower.cache');

Object.defineProperties(followerServer, {
  socketIOFollowerObject: {
    value: new Server(),
    writable: true
  }
});

describe('Add', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('follower', () => {
    it('should call updateFollowersCountInCache', async () => {
      const req: Request = followersMockRequest({}, authUserPayload2, { followerId: '6064861bc25eaa5a5d2f9bf4' }) as Request;
      const res: Response = followersMockResponse();
      jest.spyOn(FollowersCache.prototype, 'updateFollowersCountInCache');
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(mergedAuthAndUserData);

      await Add.prototype.follower(req, res);
      expect(FollowersCache.prototype.updateFollowersCountInCache).toHaveBeenCalledTimes(2);
      expect(FollowersCache.prototype.updateFollowersCountInCache).toHaveBeenCalledWith('6064861bc25eaa5a5d2f9bf4', 'followersCount', 1);
      expect(FollowersCache.prototype.updateFollowersCountInCache).toHaveBeenCalledWith(
        `${mergedAuthAndUserData._id}`,
        'followingCount',
        1
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Following user now'
      });
    });

    it('should call saveFollowerToCache', async () => {
      const req: Request = followersMockRequest({}, authUserPayload2, { followerId: '6064861bc25eaa5a5d2f9bf4' }) as Request;
      const res: Response = followersMockResponse();
      jest.spyOn(followerServer.socketIOFollowerObject, 'emit');
      jest.spyOn(FollowersCache.prototype, 'saveFollowerToCache');
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(mergedAuthAndUserData);

      await Add.prototype.follower(req, res);
      expect(UserCache.prototype.getUserFromCache).toHaveBeenCalledTimes(2);
      expect(FollowersCache.prototype.saveFollowerToCache).toHaveBeenCalledTimes(2);
      expect(FollowersCache.prototype.saveFollowerToCache).toHaveBeenCalledWith(
        `following:${mergedAuthAndUserData._id}`,
        '6064861bc25eaa5a5d2f9bf4'
      );
      expect(FollowersCache.prototype.saveFollowerToCache).toHaveBeenCalledWith(
        'followers:6064861bc25eaa5a5d2f9bf4',
        `${mergedAuthAndUserData._id}`
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Following user now'
      });
    });

    it('should call followerQueue addFollowerJob', async () => {
      const req: Request = followersMockRequest({}, authUserPayload2, { followerId: '6064861bc25eaa5a5d2f9bf4' }) as Request;
      const res: Response = followersMockResponse();
      const spy = jest.spyOn(followerQueue, 'addFollowerJob');
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(mergedAuthAndUserData);
      await Add.prototype.follower(req, res);
      expect(followerQueue.addFollowerJob).toHaveBeenCalledWith('addFollowerToDB', {
        keyOne: `${req.currentUser?.userId}`,
        keyTwo: '6064861bc25eaa5a5d2f9bf4',
        username: req.currentUser?.username,
        followerDocumentId: spy.mock.calls[0][1].followerDocumentId
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Following user now'
      });
    });
  });
});
