import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { PostCache } from '@services/redis/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { socketIOPostObject } from '@socket/post';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { UploadApiResponse } from 'cloudinary';
import { BadRequestError } from '@global/helpers/error-handler';
import { uploads } from '@global/helpers/cloudinary-upload';
import { imageQueue } from '@services/queues/image.queue';

const postCache: PostCache = new PostCache();

export class Update {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response) {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion
    } as IPostDocument;
    const result: IPostDocument = (await postCache.updatePostInCache(postId, updatedPost)) as IPostDocument;
    socketIOPostObject.emit('update post', result, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost });
    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response) {
    const { imgId, imgVersion } = req.body;

    if (imgId && imgVersion) {
      await Update.prototype.updatePostWithImage(req);
    } else {
      const result: UploadApiResponse = await Update.prototype.addImageToExistingPost(req);
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }
    }

    res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' });
  }

  private async updatePostWithImage(req: Request): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion
    } as IPostDocument;
    const result: IPostDocument = (await postCache.updatePostInCache(postId, updatedPost)) as IPostDocument;
    socketIOPostObject.emit('update post', result, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost });
  }

  private async addImageToExistingPost(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image } = req.body;
    const { postId } = req.params;

    const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;

    if (!result.public_id) {
      return result;
    }
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      profilePicture,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    } as IPostDocument;
    const postUpdated: IPostDocument = (await postCache.updatePostInCache(postId, updatedPost)) as IPostDocument;
    socketIOPostObject.emit('update post', postUpdated, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost });
    imageQueue.addImageJob('addImageToDB', {
      key: `${req.currentUser!.userId}`,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    });
    return result;
  }
}
