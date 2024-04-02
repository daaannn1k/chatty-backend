import { config } from '@root/config';
import Logger from 'bunyan';
import { find } from 'lodash';

import { BaseCache } from '@services/redis/base.cache';
import { ServerError } from '@global/helpers/error-handler';

import { Helpers } from '@global/helpers/helpers';
import { ICommentDocument, ICommentNameList } from '@comments/interfaces/comment.interface';

const log: Logger = config.createLogger('commentsCache');

export class CommentsCache extends BaseCache {
  constructor() {
    super('commentsCache');
  }

  public async savePostCommentToCache(postId: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.LPUSH(`comments:${postId}`, value);
      const commentsCount: string = (await this.client.HGET(`posts:${postId}`, 'commentsCount')) as string;
      const parsedCommentsCount: number = parseInt(commentsCount, 10) + 1;
      await this.client.HSET(`posts:${postId}`, 'commentsCount', `${parsedCommentsCount}`);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getPostCommentsFromCache(postId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const list: ICommentDocument[] = [];
      for (const item of comments) {
        list.push(Helpers.parseJson(item));
      }

      return list;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getCommentUsersForPostFromCache(postId: string): Promise<ICommentNameList[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.LLEN(`comments:${postId}`);
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const names: string[] = [];

      for (const comment of comments) {
        const parsedComment: ICommentDocument = Helpers.parseJson(comment) as ICommentDocument;
        names.push(parsedComment.username);
      }

      const response: ICommentNameList = {
        count,
        names
      };

      return [response];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getSingleCommentFromCache(postId: string, commentId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const list: ICommentDocument[] = [];

      for (const comment of comments) {
        list.push(Helpers.parseJson(comment));
      }

      const comment: ICommentDocument = find(list, (item: ICommentDocument) => item?._id === commentId) as ICommentDocument;

      return [comment];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
