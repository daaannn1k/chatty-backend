import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

import { CommentsCache } from '@services/redis/comment.cache';
import { commentQueue } from '@services/queues/comment.queue';
import { addCommentSchema } from '@comments/schemes/comment';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { ICommentDocument, ICommentJob } from '@comments/interfaces/comment.interface';

const commentCache: CommentsCache = new CommentsCache();

export class Add {
  @joiValidation(addCommentSchema)
  public async comment(req: Request, res: Response): Promise<void> {
    const { userTo, comment, postId, profilePicture } = req.body;
    const userFrom: string = req.currentUser!.username;
    const userFromId: string = req.currentUser!.userId;
    const avatarColor: string = req.currentUser!.avatarColor;
    const commentData: ICommentDocument = {
      _id: new ObjectId(),
      username: `${userFrom}`,
      avatarColor: `${avatarColor}`,
      postId,
      profilePicture,
      comment,
      userTo,
      createdAt: new Date()
    } as ICommentDocument;

    await commentCache.savePostCommentToCache(postId, JSON.stringify(commentData));
    const commentToSaveDB: ICommentJob = {
      userTo,
      comment: commentData,
      postId,
      userFrom: `${userFromId}`,
      username: userFrom
    } as ICommentJob;
    commentQueue.addCommentJob('addCommentToDB', commentToSaveDB);

    res.status(HTTP_STATUS.OK).json({ message: 'Comment created successfully' });
  }
}
