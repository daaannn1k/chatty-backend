import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';

import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { addReactionSchema } from '@reactions/schemes/reactions';
import { ReactionsCache } from '@services/redis/reaction.cache';
import { IReactionDocument, IReactionJob } from '@reactions/interfaces/reaction.interface';
import { reactionQueue } from '@services/queues/reaction.queue';

export const reactionsCache: ReactionsCache = new ReactionsCache();

export class Add {
  @joiValidation(addReactionSchema)
  public async reaction(req: Request, res: Response): Promise<void> {
    const { postId, userTo, type, previousReaction, postReactions, profilePicture } = req.body;
    const reactionObject: IReactionDocument = {
      _id: new ObjectId(),
      postId,
      type,
      avataColor: req.currentUser!.avatarColor,
      username: req.currentUser!.username,
      profilePicture
    } as IReactionDocument;

    await reactionsCache.savePostReactionToCache(postId, reactionObject, postReactions, type, previousReaction);

    const databaseReactionData: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      previousReaction,
      reactionObject,
      type,
      userTo,
      userFrom: req.currentUser!.userId
    };

    reactionQueue.addReactionJob('addReactionToDB', databaseReactionData);

    res.status(HTTP_STATUS.OK).json({ message: 'Reaction added successfully' });
  }
}
