/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload } from '@root/mocks/auth.mock';
import * as postServer from '@socket/post';
import { postMockData, postMockRequest, postMockResponse, updatedPost, updatedPostMockData, updatedPostWithImage } from '@root/mocks/post.mock';
import { PostCache } from '@services/redis/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { Update } from '@post/controllers/update-post';
import * as cloudinaryUploads from '@global/helpers/cloudinary-upload';
import { IPostDocument } from '@post/interfaces/post.interface';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/post.cache');
jest.mock('@global/helpers/cloudinary-upload');

Object.defineProperties(postServer, {
  socketIOPostObject: {
    value: new Server(),
    writable: true
  }
});

describe('Update', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('posts', () => {
    it('should send correct json response', async () => {
      const req: Request = postMockRequest(updatedPost, authUserPayload, { postId: `${postMockData._id}` }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostInCache').mockResolvedValue(updatedPostMockData);
      jest.spyOn(postServer.socketIOPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await Update.prototype.post(req, res);
      expect(postSpy).toHaveBeenCalledWith(`${postMockData._id}`, updatedPost);
      expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('update post', updatedPostMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostInDB', { key: `${postMockData._id}`, value: updatedPost });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post updated successfully'
      });
    });
  });

  describe('postWithImage', () => {
    it('should send correct json response if imgId and imgVersion exists', async () => {
      updatedPostWithImage.imgId = '1234';
      updatedPostWithImage.imgVersion = '1234';
      updatedPostWithImage.image = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      updatedPostWithImage.post = 'Welcome, dear!';
      updatedPost.imgId = '1234';
      updatedPost.imgVersion = '1234';
      updatedPost.post = updatedPostWithImage.post;
      const postUpdatedWithImage = { ...updatedPostMockData, post: updatedPostWithImage.post} as IPostDocument;
      const req: Request = postMockRequest(updatedPostWithImage, authUserPayload, { postId: `${postMockData._id}` }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostInCache').mockResolvedValue(postUpdatedWithImage);
      jest.spyOn(postServer.socketIOPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await Update.prototype.postWithImage(req, res);
      expect(PostCache.prototype.updatePostInCache).toHaveBeenCalledWith(`${postMockData._id}`, updatedPost);
      expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('update post', postUpdatedWithImage, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostInDB', { key: `${postMockData._id}`, value: updatedPost });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post with image updated successfully'
      });
    });

    it('should send correct json response if no imgId and imgVersion', async () => {
      updatedPostWithImage.imgId = '1234';
      updatedPostWithImage.imgVersion = '1234';
      updatedPost.imgId = '1234';
      updatedPost.imgVersion = '1234';
      updatedPost.post = updatedPostWithImage.post;
      updatedPostWithImage.image = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      const postUpdatedWithImage = { ...postMockData, post: updatedPostWithImage.post} as IPostDocument;
      const req: Request = postMockRequest(updatedPostWithImage, authUserPayload, { postId: `${postMockData._id}` }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostInCache').mockResolvedValue(postUpdatedWithImage);;
      jest.spyOn(cloudinaryUploads, 'uploads').mockImplementation((): any => Promise.resolve({ version: '1234', public_id: '123456' }));
      jest.spyOn(postServer.socketIOPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await Update.prototype.postWithImage(req, res);
      expect(PostCache.prototype.updatePostInCache).toHaveBeenCalledWith(`${postMockData._id}`, postSpy.mock.calls[0][1]);
      expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('update post', postUpdatedWithImage, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostInDB', { key: `${postMockData._id}`, value: updatedPost });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post with image updated successfully'
      });
    });
  });
});
