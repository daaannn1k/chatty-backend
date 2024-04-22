import { Request, Response } from 'express';
import { authUserPayload, authMockReq, authMoqRes } from '@root/mocks/auth.mock';
import { UpdateSettings } from '@user/controllers/update-settings';
import { userQueue } from '@services/queues/user.queue';
import { UserCache } from '@services/redis/user.cache';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/user.cache');

describe('Settings', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('update', () => {
    it('should call "addUserJob" methods', async () => {
      const settings = {
        messages: true,
        reactions: false,
        comments: true,
        follows: false
      };
      const req: Request = authMockReq({}, settings, authUserPayload) as Request;
      const res: Response = authMoqRes();
      jest.spyOn(UserCache.prototype, 'updateSingleUserItemInCache');
      jest.spyOn(userQueue, 'addUserJob');

      await UpdateSettings.prototype.notification(req, res);
      expect(UserCache.prototype.updateSingleUserItemInCache).toHaveBeenCalledWith(`${req.currentUser?.userId}`, 'notifications', req.body);
      expect(userQueue.addUserJob).toHaveBeenCalledWith('updateNotificationSettings', {
        key: `${req.currentUser?.userId}`,
        value: req.body
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification settings updated successfully', settings: req.body });
    });
  });
});
