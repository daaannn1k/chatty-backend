import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { Helpers } from '@global/helpers/helpers';
import { ISearchUser } from '@user/interfaces/user.interace';
import { userService } from '@services/db/user.service';

export class Search {
  public async user(req: Request, res: Response): Promise<void> {
    let users: ISearchUser[] = [];
    const regex = RegExp(Helpers.escapeRegex(req.params.query), 'i');
    users = await userService.searchUsers(regex);

    res.status(HTTP_STATUS.OK).json({ message: 'Search results', search: users });
  }
}
