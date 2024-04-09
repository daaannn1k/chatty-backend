import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { UserCache } from '@services/redis/user.cache';
import { socketIOImageObject } from '@socket/image';
import { imageQueue } from '@services/queues/image.queue';
import { IFileImageDocument } from '@images/interfaces/image.interface';
import { imageService } from '@services/db/image.service';
import { IUserDocument } from '@user/interfaces/user.interace';

const userCache: UserCache = new UserCache();

export class Delete {
  public async profileImage(req: Request, res: Response): Promise<void> {
    const { imageId } = req.params;

    socketIOImageObject.emit('delete image', imageId);

    imageQueue.addImageJob('removeImageFromDB', {
      imageId
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }

  public async backgroundImage(req: Request, res: Response): Promise<void> {
    const image: IFileImageDocument | null = await imageService.getImageByBackgroundId(req.params.bgImageId);
    socketIOImageObject.emit('delete image', image?._id);

    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      ''
    ) as Promise<IUserDocument>;

    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      ''
    ) as Promise<IUserDocument>;

    (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];

    imageQueue.addImageJob('removeImageFromDB', {
      imageId: image?._id,
      key: `${req.currentUser!.userId}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }
}
