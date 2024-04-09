import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UserCache } from '@services/redis/user.cache';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { addImageSchema } from '@images/schemes/images';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { imageQueue } from '@services/queues/image.queue';
import { IUserDocument } from '@user/interfaces/user.interace';
import { socketIOImageObject } from '@socket/image';
import { IBgUploadResponse } from '@images/interfaces/image.interface';
import { Helpers } from '@global/helpers/helpers';

const userCache: UserCache = new UserCache();

export class Add {
  @joiValidation(addImageSchema)
  public async profileImage(req: Request, res: Response): Promise<void> {
    const { image } = req.body;

    const result: UploadApiResponse = (await uploads(image, req.currentUser!.userId, true, true)) as UploadApiResponse;

    if (!result.public_id) {
      throw new BadRequestError('File upload: Error occurred. Try again!');
    }

    const profilePicture: string = `https://res.cloudinary.com/diwokovnd/image/upload/v${result.version}/${result.public_id}`;

    const cachedUser: IUserDocument = (await userCache.updateSingleUserItemInCache(
      req.currentUser!.userId,
      'profilePicture',
      profilePicture
    )) as IUserDocument;

    socketIOImageObject.emit('update user', cachedUser);

    imageQueue.addImageJob('addUserProfileImageToDB', {
      key: `${req.currentUser!.userId}`,
      value: profilePicture,
      imgId: `${result.public_id}`,
      imgVersion: result.version.toString()
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  @joiValidation(addImageSchema)
  public async backgroundImage(req: Request, res: Response): Promise<void> {
    const { image } = req.body;
    const { version, publicId }: IBgUploadResponse = await Add.prototype.backgroundUpload(image);

    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      publicId
    ) as Promise<IUserDocument>;

    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      version
    ) as Promise<IUserDocument>;

    const response: [IUserDocument, IUserDocument] = (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];

    socketIOImageObject.emit('update user', {
      bgImageId: publicId,
      bgImageVersion: version,
      userId: response[0]
    });

    imageQueue.addImageJob('updateBGImageInDB', {
      key: `${req.currentUser!.userId}`,
      imgId: publicId,
      imgVersion: version.toString()
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  private async backgroundUpload(image: string): Promise<IBgUploadResponse> {
    const isDataURL = Helpers.isDataURL(image);
    let version = '';
    let publicId = '';

    if (isDataURL) {
      const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;

      if (!result.public_id) {
        throw new BadRequestError(result.message);
      } else {
        version = result.version.toString();
        publicId = result.public_id;
      }
    } else {
      const value = image.split('/');
      version = value[value.length - 2];
      publicId = value[value.length - 1];
    }

    return { version: version.replace(/v/g, ''), publicId };
  }
}