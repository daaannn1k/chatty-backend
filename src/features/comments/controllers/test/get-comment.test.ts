import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { commentNames, commentsData, reactionMockRequest, reactionMockResponse } from '@root/mocks/reactions.mock';
import { CommentsCache } from '@services/redis/comment.cache';
import { Get } from '@comments/controllers/get-comments';
import { commentService } from '@services/db/comment.service';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/comment.cache');

describe('Get', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('comments', () => {
    it('should send correct json response if comments exist in cache', async () => {
      const postId = '6027f77087c9d9ccb1555268';
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(CommentsCache.prototype, 'getPostCommentsFromCache').mockResolvedValue([commentsData]);

      await Get.prototype.comments(req, res);
      expect(CommentsCache.prototype.getPostCommentsFromCache).toHaveBeenCalledWith('6027f77087c9d9ccb1555268');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `All post ${postId} comments`,
        comments: [commentsData]
      });
    });

    it('should send correct json response if comments exist in database', async () => {
      const postId = '6027f77087c9d9ccb1555268';
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(CommentsCache.prototype, 'getPostCommentsFromCache').mockResolvedValue([]);
      jest.spyOn(commentService, 'getPostCommentsFromDB').mockResolvedValue([commentsData]);

      await Get.prototype.comments(req, res);
      expect(commentService.getPostCommentsFromDB).toHaveBeenCalledWith(
        { postId: new mongoose.Types.ObjectId('6027f77087c9d9ccb1555268') },
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `All post ${postId} comments`,
        comments: [commentsData]
      });
    });
  });

  describe('commentsNamesFromCache', () => {
    const postId = '6027f77087c9d9ccb1555268';
    it('should send correct json response if data exist in redis', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(CommentsCache.prototype, 'getCommentUsersForPostFromCache').mockResolvedValue([commentNames]);

      await Get.prototype.commentNames(req, res);
      expect(CommentsCache.prototype.getCommentUsersForPostFromCache).toHaveBeenCalledWith('6027f77087c9d9ccb1555268');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Post ${postId} comment names`,
        comments: [commentNames]
      });
    });

    it('should send correct json response if data exist in database', async () => {
      const postId = '6027f77087c9d9ccb1555268';
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(CommentsCache.prototype, 'getCommentUsersForPostFromCache').mockResolvedValue([]);
      jest.spyOn(commentService, 'getPostCommentNamesFromDB').mockResolvedValue([commentNames]);

      await Get.prototype.commentNames(req, res);
      expect(commentService.getPostCommentNamesFromDB).toHaveBeenCalledWith(
        { postId: new mongoose.Types.ObjectId('6027f77087c9d9ccb1555268') },
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Post ${postId} comment names`,
        comments: [commentNames]
      });
    });

    it('should return empty comments if data does not exist in redis and database', async () => {
      const postId = '6027f77087c9d9ccb1555268';
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(CommentsCache.prototype, 'getCommentUsersForPostFromCache').mockResolvedValue([]);
      jest.spyOn(commentService, 'getPostCommentNamesFromDB').mockResolvedValue([]);

      await Get.prototype.commentNames(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Post ${postId} comment names`,
        comments: []
      });
    });
  });

  describe('singleComment', () => {
    it('should send correct json response from cache', async () => {
      const commentId = '6064861bc25eaa5a5d2f9bf4';
      const postId = '6027f77087c9d9ccb1555268';
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        commentId,
        postId
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(CommentsCache.prototype, 'getSingleCommentFromCache').mockResolvedValue([commentsData]);

      await Get.prototype.singleComment(req, res);
      expect(CommentsCache.prototype.getSingleCommentFromCache).toHaveBeenCalledWith('6027f77087c9d9ccb1555268', '6064861bc25eaa5a5d2f9bf4');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Comment by id ${commentId}`,
        comment: commentsData
      });
    });

    it('should send correct json response from database', async () => {
      const commentId = '6064861bc25eaa5a5d2f9bf4';
      const postId = '6027f77087c9d9ccb1555268';
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        commentId,
        postId
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(CommentsCache.prototype, 'getSingleCommentFromCache').mockResolvedValue([]);
      jest.spyOn(commentService, 'getPostCommentsFromDB').mockResolvedValue([commentsData]);

      await Get.prototype.singleComment(req, res);
      expect(commentService.getPostCommentsFromDB).toHaveBeenCalledWith(
        { _id: new mongoose.Types.ObjectId('6064861bc25eaa5a5d2f9bf4') },
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Comment by id ${commentId}`,
        comment: commentsData
      });
    });
  });
});
