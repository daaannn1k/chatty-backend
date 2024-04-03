import { config } from '@root/config';
import Logger from 'bunyan';
import { find } from 'lodash';

import { BaseCache } from '@services/redis/base.cache';
import { ServerError } from '@global/helpers/error-handler';
import { IReactionDocument, IReactions } from '@reactions/interfaces/reaction.interface';
import { Helpers } from '@global/helpers/helpers';

const log: Logger = config.createLogger('reactionsCache');

export class ReactionsCache extends BaseCache {
  constructor() {
    super('reactionsCache');
  }

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionDocument,
    postReactions: IReactions,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (previousReaction) {
        await this.removePostReactionFromCache(key, reaction.username, postReactions);
      }

      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));
        await this.client.HSET(`posts:${key}`, 'reactions', JSON.stringify(postReactions));
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async removePostReactionFromCache(key: string, username: string, postReactions: IReactions): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const userPreviousReaction: IReactionDocument = this.getPreviousReaction(response, username) as IReactionDocument;
      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction));
      await multi.exec();
      await this.client.HSET(`posts:${key}`, 'reactions', JSON.stringify(postReactions));
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getReactionsFromCache(key: string): Promise<[IReactionDocument[], number]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reactionsCount: number = await this.client.LLEN(`reactions:${key}`);
      const reactions: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);
      const list: IReactionDocument[] = [];
      for (const item of reactions) {
        list.push(Helpers.parseJson(item));
      }

      return reactionsCount ? [list, reactionsCount] : [[], 0];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getReactionsFromCacheByUsername(key: string, username: string): Promise<[IReactionDocument, number] | []> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reactions: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);
      const list: IReactionDocument[] = [];
      for (const item of reactions) {
        list.push(Helpers.parseJson(item));
      }

      const result: IReactionDocument = find(list, (listItem: IReactionDocument) => {
        return listItem?.postId === key && listItem?.username === username;
      }) as IReactionDocument;

      return result ? [result, 1] : [];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  private getPreviousReaction(response: string[], username: string): IReactionDocument | undefined {
    const list: IReactionDocument[] = [];

    for (const item of response) {
      list.push(Helpers.parseJson(item) as IReactionDocument);
    }

    return find(list, (listItem: IReactionDocument) => {
      return listItem.username === username;
    });
  }
}