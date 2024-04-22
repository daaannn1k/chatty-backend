import mongoose from 'mongoose';

import { ImageModel } from '@images/models/image.schema';
import { UserModel } from '@user/models/user.schema';
import { IFileImageDocument } from '@images/interfaces/image.interface';

class ImageService {
  public async addUserProfileImageToDB(userId: string, url: string, imgId: string, imgVersion: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          profilePicture: url
        }
      }
    ).exec();

    await this.addImage(userId, imgId, imgVersion, 'profile');
  }

  public async addBackgroundImageToDB(userId: string, imgId: string, imgVersion: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          bgImageVersion: imgVersion,
          bgImageId: imgId
        }
      }
    ).exec();

    await this.addImage(userId, imgId, imgVersion, 'background');
  }

  public async addImage(userId: string, imgId: string, imgVersion: string, type: string): Promise<void> {
    await ImageModel.create({
      userId,
      bgImageVersion: type === 'background' ? imgVersion : '',
      bgImageId: type === 'background' ? imgId : '',
      imgVersion,
      imgId
    });
  }

  public async removeImageFromDB(imageId: string, userId?: string): Promise<void> {
    if (userId) {
      await this.removeBgDatafromUser(userId);
    }
    await ImageModel.deleteOne({ _id: imageId }).exec();
  }

  public async removeBgDatafromUser(userId: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          bgImageVersion: '',
          bgImageId: ''
        }
      }
    );
  }

  public async getImageByBackgroundId(bgImageId: string): Promise<IFileImageDocument | null> {
    const result: IFileImageDocument | null = await ImageModel.findOne({ bgImageId }).exec();
    return result;
  }

  public async getImages(userId: string): Promise<IFileImageDocument[]> {
    const result: IFileImageDocument[] = await ImageModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId) } }]);

    return result;
  }
}

export const imageService: ImageService = new ImageService();
