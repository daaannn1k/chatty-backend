import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { userService } from '@services/db/user.service';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interace';

const userCache: UserCache = new UserCache();

export class CurrentUser {
  public async read(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let token = null;
    let user = null;

    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${req.currentUser!.userId}`);

    const users = await userService.getAllUsers('660d1093a704a4ee517cd335', 0, 10);

    if (Object.keys(existingUser).length) {
      isUser = true;
      token = req.session!.jwt;
      user = existingUser;
    }

    res.status(HTTP_STATUS.OK).json({ token, isUser, user, users });
  }
}
