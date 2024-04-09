import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload } from '@root/mocks/auth.mock';
import * as imageServer from '@socket/image';
import { fileDocumentMock, imagesMockRequest, imagesMockResponse } from '@root/mocks/image.mock';
import { imageQueue } from '@services/queues/image.queue';
import { Delete } from '@images/controllers/delete-image';
import { imageService } from '@services/db/image.service';
import { UserCache } from '@services/redis/user.cache';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/user.cache');

Object.defineProperties(imageServer, {
  socketIOImageObject: {
    value: new Server(),
    writable: true
  }
});

describe('Delete', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should send correct json response for image upload', async () => {
    const req: Request = imagesMockRequest({}, {}, authUserPayload, { imageId: '12345' }) as Request;
    const res: Response = imagesMockResponse();
    jest.spyOn(imageServer.socketIOImageObject, 'emit');
    jest.spyOn(imageQueue, 'addImageJob');

    await Delete.prototype.profileImage(req, res);
    expect(imageServer.socketIOImageObject.emit).toHaveBeenCalledWith('delete image', req.params.imageId);
    expect(imageQueue.addImageJob).toHaveBeenCalledWith('removeImageFromDB', { imageId: req.params.imageId });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Image deleted successfully'
    });
  });

  it('should send correct json response for background image upload', async () => {
    const req: Request = imagesMockRequest({}, {}, authUserPayload, { bgImageId: '12345' }) as Request;
    const res: Response = imagesMockResponse();
    jest.spyOn(imageServer.socketIOImageObject, 'emit');
    jest.spyOn(imageQueue, 'addImageJob');
    jest.spyOn(imageService, 'getImageByBackgroundId').mockResolvedValue(fileDocumentMock);
    jest.spyOn(UserCache.prototype, 'updateSingleUserItemInCache');

    await Delete.prototype.backgroundImage(req, res);
    expect(imageServer.socketIOImageObject.emit).toHaveBeenCalledWith('delete image', req.params.imageId);
    expect(imageQueue.addImageJob).toHaveBeenCalledWith('removeImageFromDB', {
      imageId: req.params.imageId,
      key: '60263f14648fed5246e322d9'
    });
    expect(UserCache.prototype.updateSingleUserItemInCache).toHaveBeenCalledWith(`${req.currentUser?.userId}`, 'bgImageVersion', '');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Image deleted successfully'
    });
  });
});
