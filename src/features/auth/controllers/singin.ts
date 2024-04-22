import { Request, Response } from 'express';
import JWT from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';
import { authService } from '@services/db/auth.service';

import { config } from '@root/config';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { BadRequestError, NotAuthorizedError } from '@global/helpers/error-handler';
import { loginSchema } from '@auth/schemes/signin';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { IUserDocument } from '@user/interfaces/user.interace';
import { userService } from '@services/db/user.service';

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    const userExist: IAuthDocument | null = await authService.getAuthUserByUsername(username);
    if (!userExist) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch: boolean = await userExist.comparePassword(password);

    if (!passwordsMatch) {
      throw new NotAuthorizedError('Invalid password');
    }

    const user: IUserDocument = await userService.getUserByAuthId(`${userExist._id}`);

    const userJWT: string = JWT.sign(
      {
        userId: user._id,
        uId: userExist.uId,
        email: userExist.email,
        username: userExist.username,
        avatarColor: userExist.avatarColor
      },
      config.JWT_TOKEN!
    );

    const userDocument: IUserDocument = {
      ...user,
      authId: userExist!._id,
      email: userExist!.email,
      username: userExist!.username,
      uId: userExist!.uId,
      avatarColor: userExist!.avatarColor,
      createdAt: userExist!.createdAt
    } as IUserDocument;

    req.session = { jwt: userJWT };
    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: userDocument, token: userJWT });
  }
}
