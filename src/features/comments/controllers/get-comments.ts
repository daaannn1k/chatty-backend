import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { CommentsCache } from '@services/redis/comment.cache';
import { ICommentDocument, ICommentNameList } from '@comments/interfaces/comment.interface';
import { commentService } from '@services/db/comment.service';
import mongoose from 'mongoose';

const commentCache: CommentsCache = new CommentsCache();

export class Get {
  public async comments(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;

    const cachedComments: ICommentDocument[] = await commentCache.getPostCommentsFromCache(postId);
    const comments: ICommentDocument[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostCommentsFromDB({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: `All post ${postId} comments`, comments });
  }

  public async commentNames(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;

    const cachedComments: ICommentNameList[] = await commentCache.getCommentUsersForPostFromCache(postId);
    const comments: ICommentNameList[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostCommentNamesFromDB({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: `Post ${postId} comment names`, comments });
  }

  public async singleComment(req: Request, res: Response): Promise<void> {
    const { postId, commentId } = req.params;

    const cachedComment: ICommentDocument[] = await commentCache.getSingleCommentFromCache(postId, commentId);
    const comment: ICommentDocument[] = cachedComment.length
      ? cachedComment
      : await commentService.getPostCommentsFromDB({ _id: new mongoose.Types.ObjectId(commentId) }, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: `Comment by id ${commentId}`, comment: comment[0] });
  }
}
