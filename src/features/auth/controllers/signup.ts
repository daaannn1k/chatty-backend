import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { signupSchema } from '@auth/schemes/signup';
import { authService } from '@services/db/auth.service';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { uploads } from '@global/helpers/cloudinary-upload';
import { UploadApiResponse } from 'cloudinary';
import { IUserDocument } from '@user/interfaces/user.interace';
import { UserCache } from '@services/redis/user.cache';
import { omit } from 'lodash';
import JWT from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';

import { authQueue } from '@services/queues/auth.queue';
import { userQueue } from '@services/queues/user.queue';
import { config } from '@root/config';

const userCache: UserCache = new UserCache();

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, password, email, avatarColor, avatarImage } = req.body;
    const userExist: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);

    if (userExist) {
      throw new BadRequestError('Invalid credentials');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    console.log('AUTHOBJECTID', authObjectId);
    console.log('USEROBJECTID', userObjectId);
    const uId = `${Helpers.generateRandomIntegers(12)}`;
    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      email,
      avatarColor,
      password
    });
    const result: UploadApiResponse = (await uploads(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse;

    if (!result.public_id) {
      throw new BadRequestError('File upload: Error occurred. Try again!');
    }

    // Add to redis cache

    const userDataForCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId);
    userDataForCache.profilePicture = `https://res.cloudinary.com/diwokovnd/image/upload/v${result.version}/${userObjectId}`;

    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

    //Add to database

    omit(userDataForCache, ['username', 'password', 'uId', 'avatarColor', 'email']);

    //To check it later
    const authUserToSave: IUserDocument = { ...userDataForCache, _id: authObjectId } as IUserDocument;
    authQueue.addAuthUserJob('addAuthUserToDB', { value: authUserToSave });
    userQueue.addUserJob('addUserToDB', { value: userDataForCache });

    const userJWT: string = SignUp.prototype.signToken(authData, userObjectId);
    req.session = { jwt: userJWT };

    res.status(HTTP_STATUS.CREATED).json({ message: 'Created', user: userDataForCache, token: userJWT });
  }

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_TOKEN!
    );
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data;

    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date()
    } as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;

    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageId: '',
      bgImageVersion: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument;
  }
}
