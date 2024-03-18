import { Request, Response } from 'express';
import { CurrentUser } from '@auth/controllers/current-user';
import { authMockReq, authMoqRes, authUserPayload } from '@root/mocks/auth.mock';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interace';

jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/user.cache');
jest.mock('@services/db/user.service');

const USERNAME = 'Manny';
const PASSWORD = 'manny1';

describe('CurrentUser', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('token', () => {
    it('should set session token to null and send correct json response', async () => {
      const req: Request = authMockReq({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue({} as IUserDocument);

      await CurrentUser.prototype.read(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: null,
        isUser: false,
        user: null
      });
    });

    it('should set session token and send correct json response', async () => {
      const req: Request = authMockReq({ jwt: '12djdj34' }, { username: USERNAME, password: PASSWORD }, authUserPayload) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(mergedAuthAndUserData);

      await CurrentUser.prototype.read(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: req.session?.jwt,
        isUser: true,
        user: mergedAuthAndUserData
      });
    });
  });
});
