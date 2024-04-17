import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { authMockReq, authMoqRes, authUserPayload, authUserPayload2 } from '@root/mocks/auth.mock';
import { UserCache } from '@services/redis/user.cache';
import { FollowersCache } from '@services/redis/follower.cache';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';
import { Get } from '@user/controllers/get-profile';
import { PostCache } from '@services/redis/post.cache';
import { postMockData } from '@root/mocks/post.mock';
import { mockFollowerData } from '@root/mocks/followers.mock';
import { followerService } from '@services/db/follower.service';
import { userService } from '@services/db/user.service';
import { postService } from '@services/db/post.service';
import { Helpers } from '@global/helpers/helpers';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/post.cache');
jest.mock('@services/redis/follower.cache');
jest.mock('@services/redis/user.cache');
jest.mock('@services/db/user.service');
jest.mock('@services/db/follower.service');

describe('Get', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('all', () => {
    it('should send success json response if users in cache', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload, { page: '1' }) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUsersFromCache').mockResolvedValue([mergedAuthAndUserData]);
      jest.spyOn(UserCache.prototype, 'getTotalUsersFromCache').mockResolvedValue(1);
      jest.spyOn(FollowersCache.prototype, 'getFollowersFromCache').mockResolvedValue([mockFollowerData]);
      await Get.prototype.all(req, res);
      expect(FollowersCache.prototype.getFollowersFromCache).toHaveBeenCalledWith(`followers:${req.currentUser!.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get users',
        users: [mergedAuthAndUserData],
        followers: [mockFollowerData],
        totalUsers: 1
      });
    });

    it('should send success json response if users in database', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload, { page: '1' }) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUsersFromCache').mockResolvedValue([]);
      jest.spyOn(UserCache.prototype, 'getTotalUsersFromCache').mockResolvedValue(0);
      jest.spyOn(FollowersCache.prototype, 'getFollowersFromCache').mockResolvedValue([]);
      jest.spyOn(followerService, 'getFollowerData').mockResolvedValue([mockFollowerData]);
      jest.spyOn(userService, 'getAllUsers').mockResolvedValue([mergedAuthAndUserData]);
      jest.spyOn(userService, 'getAllUsersInDB').mockResolvedValue(1);

      await Get.prototype.all(req, res);
      expect(followerService.getFollowerData).toHaveBeenCalledWith(new mongoose.Types.ObjectId(req.currentUser!.userId));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get users',
        users: [mergedAuthAndUserData],
        followers: [mockFollowerData],
        totalUsers: 1
      });
    });
  });

  describe('profile', () => {
    it('should send success json response if user in cache', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(mergedAuthAndUserData);
      await Get.prototype.profile(req, res);
      expect(UserCache.prototype.getUserFromCache).toHaveBeenCalledWith(`${req.currentUser?.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile',
        user: mergedAuthAndUserData
      });
    });

    it('should send success json response if user in database', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(null);
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mergedAuthAndUserData);

      await Get.prototype.profile(req, res);
      expect(userService.getUserById).toHaveBeenCalledWith(`${req.currentUser?.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile',
        user: mergedAuthAndUserData
      });
    });
  });

  describe('profileAndPosts', () => {
    it('should send success json response if user in cache', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload2, {
        username: mergedAuthAndUserData.username,
        userId: mergedAuthAndUserData._id,
        uId: mergedAuthAndUserData.uId
      }) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(mergedAuthAndUserData);
      jest.spyOn(PostCache.prototype, 'getPostsByUserFromCache').mockResolvedValue([postMockData]);

      await Get.prototype.profileAndPosts(req, res);
      expect(UserCache.prototype.getUserFromCache).toHaveBeenCalledWith(`${req.currentUser?.userId}`);
      expect(PostCache.prototype.getPostsByUserFromCache).toHaveBeenCalledWith('post', parseInt(req.params.uId, 10));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile and posts',
        user: mergedAuthAndUserData,
        posts: [postMockData]
      });
    });

    it('should send success json response if user in database', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload, {
        username: mergedAuthAndUserData.username,
        userId: mergedAuthAndUserData._id,
        uId: mergedAuthAndUserData.uId
      }) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(null);
      jest.spyOn(PostCache.prototype, 'getPostsByUserFromCache').mockResolvedValue([]);
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mergedAuthAndUserData);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([postMockData]);

      const userName: string = Helpers.firstLetterUppercase(req.params.username);

      await Get.prototype.profileAndPosts(req, res);
      expect(userService.getUserById).toHaveBeenCalledWith(mergedAuthAndUserData._id);
      expect(postService.getPosts).toHaveBeenCalledWith({ username: userName }, 0, 100, { createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile and posts',
        user: mergedAuthAndUserData,
        posts: [postMockData]
      });
    });
  });

  describe('profileByUserId', () => {
    it('should send success json response if user in cache', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload, {
        userId: mergedAuthAndUserData._id
      }) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(mergedAuthAndUserData);

      await Get.prototype.profileById(req, res);
      expect(UserCache.prototype.getUserFromCache).toHaveBeenCalledWith(req.params.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile by id',
        user: mergedAuthAndUserData
      });
    });

    it('should send success json response if user in database', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload, {
        userId: mergedAuthAndUserData._id
      }) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(null);
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mergedAuthAndUserData);

      await Get.prototype.profileById(req, res);
      expect(userService.getUserById).toHaveBeenCalledWith(req.params.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile by id',
        user: mergedAuthAndUserData
      });
    });
  });

  describe('randomUserSuggestions', () => {
    it('should send success json response if user in cache', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getRandomUsersFromCache').mockResolvedValue([mergedAuthAndUserData]);

      await Get.prototype.randomUserSuggestions(req, res);
      expect(UserCache.prototype.getRandomUsersFromCache).toHaveBeenCalledWith(
        `${req.currentUser?.userId}`,
        `${req.currentUser?.username}`
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User suggestions',
        users: [mergedAuthAndUserData]
      });
    });

    it('should send success json response if user in database', async () => {
      const req: Request = authMockReq({}, {}, authUserPayload) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getRandomUsersFromCache').mockResolvedValue([]);
      jest.spyOn(userService, 'getRandomUsers').mockResolvedValue([mergedAuthAndUserData]);

      await Get.prototype.randomUserSuggestions(req, res);
      expect(userService.getRandomUsers).toHaveBeenCalledWith(req.currentUser!.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User suggestions',
        users: [mergedAuthAndUserData]
      });
    });
  });
});
