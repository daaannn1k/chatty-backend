import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { PostCache } from '@services/redis/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { socketIOPostObject } from '@socket/post';

const postCache: PostCache = new PostCache();

export class Delete {
  public async post(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const userId = req.currentUser!.userId;
    socketIOPostObject.emit('delete post', postId);
    await postCache.deletePostFromCache(postId, `${userId}`);
    postQueue.addPostJob('deletePostFromDB', { keyOne: postId, keyTwo: userId });
    res.status(HTTP_STATUS.OK).json({ message: 'Post deleted successfully'});
  }
}
