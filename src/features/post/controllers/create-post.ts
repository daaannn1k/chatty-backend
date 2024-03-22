import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { IPostDocument, ISavePostToCache } from '@post/interfaces/post.interface';
import { PostCache } from '@services/redis/post.cache';
import { socketIOPostObject } from '@socket/post';
import { postQueue } from '@services/queues/post.queue';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { UploadApiResponse } from 'cloudinary';

const postCache: PostCache = new PostCache();

export class Create {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body;
    console.log('GIFURL', gifUrl); // TO CHECK GIFURL. BECAUSE IF IT COMES UNDEFINED, IN CACHE IT IS SAVED AS STRING 'UNDEFINED'
    const postObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      privacy,
      gifUrl,
      feelings,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, wow: 0, sad: 0, angry: 0 }
    } as IPostDocument;

    socketIOPostObject.emit('add post', createdPost);

    const cacheDataToSave: ISavePostToCache = {
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    };

    await postCache.savePostToCache(cacheDataToSave);
    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });

    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created successfully' });
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } = req.body;

    const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;

    if (!result.public_id) {
      throw new BadRequestError(result.message);
    }

    const postObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      privacy,
      gifUrl,
      feelings,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, wow: 0, sad: 0, angry: 0 }
    } as IPostDocument;

    socketIOPostObject.emit('add post', createdPost);

    const cacheDataToSave: ISavePostToCache = {
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    };

    await postCache.savePostToCache(cacheDataToSave);
    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });

    // call image queue to add image into database

    res.status(HTTP_STATUS.CREATED).json({ message: 'Post with image created successfully' });
  }
}
