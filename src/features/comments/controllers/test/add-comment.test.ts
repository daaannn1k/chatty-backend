import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { reactionMockRequest, reactionMockResponse } from '@root/mocks/reactions.mock';
import { CommentsCache } from '@services/redis/comment.cache';
import { commentQueue } from '@services/queues/comment.queue';
import { Add } from '@comments/controllers/add-comment';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/comment.cache');

describe('Add', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should call savePostCommentToCache and addCommentJob methods', async () => {
    const req: Request = reactionMockRequest(
      {},
      {
        postId: '6027f77087c9d9ccb1555268',
        comment: 'This is a comment',
        profilePicture: 'https://place-hold.it/500x500',
        userTo: `${mergedAuthAndUserData._id}`
      },
      authUserPayload
    ) as Request;
    const res: Response = reactionMockResponse();
    jest.spyOn(CommentsCache.prototype, 'savePostCommentToCache');
    jest.spyOn(commentQueue, 'addCommentJob');

    await Add.prototype.comment(req, res);
    expect(CommentsCache.prototype.savePostCommentToCache).toHaveBeenCalled();
    expect(commentQueue.addCommentJob).toHaveBeenCalled();
  });

  it('should send correct json response', async () => {
    const req: Request = reactionMockRequest(
      {},
      {
        postId: '6027f77087c9d9ccb1555268',
        comment: 'This is a comment',
        profilePicture: 'https://place-hold.it/500x500',
        userTo: `${mergedAuthAndUserData._id}`
      },
      authUserPayload
    ) as Request;
    const res: Response = reactionMockResponse();

    await Add.prototype.comment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Comment created successfully'
    });
  });
});
