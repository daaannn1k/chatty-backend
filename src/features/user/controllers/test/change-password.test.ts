/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { authMockReq, authMoqRes, authUserPayload } from '@root/mocks/auth.mock';
import { Update } from '@user/controllers/change-password';
import { CustomError } from '@global/helpers/error-handler';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';
import { emailQueue } from '@services/queues/email.queue';
import { userService } from '@services/db/user.service';
import { authService } from '@services/db/auth.service';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/queues/email.queue');
jest.mock('@services/db/user.service');

describe('ChangePassword', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('update', () => {
    it('should throw an error if currentPassword is empty', () => {
      const req: Request = authMockReq(
        {},
        {
          currentPassword: '',
          newPassword: 'manny2',
          confirmPassword: 'manny2'
        }
      ) as Request;
      const res: Response = authMoqRes();
      Update.prototype.password(req, res).catch((error: CustomError) => {
        // expect(error.statusCode).toEqual(401);
        expect(error.serializeErrors().messsage).toEqual('Password is a required field');
      });
    });

    it('should throw an error if newPassword is empty', () => {
      const req: Request = authMockReq(
        {},
        {
          currentPassword: 'manny1',
          newPassword: '',
          confirmPassword: 'manny2'
        }
      ) as Request;
      const res: Response = authMoqRes();
      Update.prototype.password(req, res).catch((error: CustomError) => {
        // expect(error.statusCode).toEqual(401);
        expect(error.serializeErrors().messsage).toEqual('Password is a required field');
      });
    });

    it('should throw an error if confirmPassword is empty', () => {
      const req: Request = authMockReq(
        {},
        {
          currentPassword: 'manny1',
          newPassword: 'manny2',
          confirmPassword: ''
        }
      ) as Request;
      const res: Response = authMoqRes();
      Update.prototype.password(req, res).catch((error: CustomError) => {
        // expect(error.statusCode).toEqual(401);
        expect(error.serializeErrors().messsage).toEqual('Confirm password does not match new password.');
      });
    });

    it('should throw an error if currentPassword does not exist', () => {
      const req: Request = authMockReq(
        {},
        {
          currentPassword: 'manny1',
          newPassword: 'manny2',
          confirmPassword: 'manny2'
        },
        authUserPayload
      ) as Request;
      const res: Response = authMoqRes();
      const mockUser = {
        ...mergedAuthAndUserData,
        comparePassword: () => false
      };
      jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValue(mockUser as any);

      Update.prototype.password(req, res).catch((error: CustomError) => {
        // expect(error.statusCode).toEqual(401);
        expect(error.serializeErrors().messsage).toEqual('Invalid credentials');
      });
    });

    it('should send correct json response', async () => {
      const req: Request = authMockReq(
        {},
        {
          currentPassword: 'manny1',
          newPassword: 'manny2',
          confirmPassword: 'manny2'
        },
        authUserPayload
      ) as Request;
      const res: Response = authMoqRes();
      const mockUser = {
        ...mergedAuthAndUserData,
        comparePassword: () => true,
        hashPassword: () => 'djejdjr123482ejsj'
      };
      jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValue(mockUser as any);
      jest.spyOn(userService, 'updatePassword');
      const spy = jest.spyOn(emailQueue, 'addEmailJob');

      await Update.prototype.password(req, res);
      expect(userService.updatePassword).toHaveBeenCalledWith(`${req.currentUser!.userId}`, 'djejdjr123482ejsj');
      expect(emailQueue.addEmailJob).toHaveBeenCalledWith(spy.mock.calls[0][0], spy.mock.calls[0][1]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password updated successfully. You will be redirected shortly to the login page'
      });
    });
  });
});
