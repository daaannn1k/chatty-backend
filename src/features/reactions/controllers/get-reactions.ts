import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { ReactionsCache } from '@services/redis/reaction.cache';
import { IReactionDocument } from '@reactions/interfaces/reaction.interface';
import { reactionService } from '@services/db/reaction.service';
import mongoose from 'mongoose';

export const reactionsCache: ReactionsCache = new ReactionsCache();

export class Get {
  public async reactions(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const reactionsFromCache: [IReactionDocument[], number] = await reactionsCache.getReactionsFromCache(postId);
    const reactions = reactionsFromCache[1]
      ? reactionsFromCache
      : await reactionService.getPostReactions({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: `All post ${postId} reactions`, reactions: reactions[0], total: reactions[1] });
  }

  public async singleReactionByUsername(req: Request, res: Response): Promise<void> {
    const { postId, username } = req.params;
    const message = `Reaction by username: ${username} and post: ${postId}`;
    const reactionByUsernameFromCache: [IReactionDocument, number] | [] = await reactionsCache.getReactionsFromCacheByUsername(
      postId,
      username
    );
    const reactions: [IReactionDocument, number] | [] = reactionByUsernameFromCache.length
      ? reactionByUsernameFromCache
      : await reactionService.getSinglePostReactionByUsername(postId, username);

    res.status(HTTP_STATUS.OK).json({
      message,
      reaction: reactions.length ? reactions[0] : {},
      total: reactions.length ? reactions[1] : 0
    });
  }

  public async getReactionsByUsername(req: Request, res: Response): Promise<void> {
    const { username } = req.params;
    const reactions: IReactionDocument[] = await reactionService.getReactionsByUsername(username);
    res.status(HTTP_STATUS.OK).json({
      message: `All reactions by username ${username}`,
      reactions
    });
  }
}
