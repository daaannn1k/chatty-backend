import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { ReactionsCache } from '@services/redis/reaction.cache';
import { IReactionJob } from '@reactions/interfaces/reaction.interface';
import { reactionQueue } from '@services/queues/reaction.queue';

export const reactionsCache: ReactionsCache = new ReactionsCache();

export class Remove {
  public async reaction(req: Request, res: Response): Promise<void> {
    const { postId, previousReaction, postReactions } = req.params;
    const reactionToDelete: IReactionJob = {
      username: req.currentUser!.username,
      postId,
      previousReaction
    } as IReactionJob;

    await reactionsCache.removePostReactionFromCache(postId, `${req.currentUser!.username}`, JSON.parse(postReactions));
    reactionQueue.addReactionJob('removeReactionFromDB', reactionToDelete);

    res.status(HTTP_STATUS.OK).json({ message: 'Reaction removed successfully' });
  }
}
