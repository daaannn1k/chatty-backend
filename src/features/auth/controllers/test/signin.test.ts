/* eslint-disable @typescript-eslint/no-explicit-any */
import { authMock, authMockReq, authMoqRes } from '@root/mocks/auth.mock';
import { Request, Response } from 'express';
import { CustomError } from '@global/helpers/error-handler';
import { SignIn } from '@auth/controllers/singin';
import { Helpers } from '@global/helpers/helpers';
import { authService } from '@services/db/auth.service';
import { userService } from '@services/db/user.service';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';

const USERNAME = 'Manny';
const PASSWORD = 'manny1';
const WRONG_USERNAME = 'ma';
const WRONG_PASSWORD = 'ma';
const LONG_PASSWORD = 'mathematics1';
const LONG_USERNAME = 'mathematics';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');

describe('SignIn', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should throw an error if username is not available', () => {
    const req: Request = authMockReq({}, { username: '', password: PASSWORD }) as Request;
    const res: Response = authMoqRes();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Username is a required field');
    });
  });

  it('should throw an error if username length is less than minimum length', () => {
    const req: Request = authMockReq({}, { username: WRONG_USERNAME, password: WRONG_PASSWORD }) as Request;
    const res: Response = authMoqRes();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Invalid username');
    });
  });

  it('should throw an error if username length is greater than maximum length', () => {
    const req: Request = authMockReq({}, { username: LONG_USERNAME, password: WRONG_PASSWORD }) as Request;
    const res: Response = authMoqRes();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Invalid username');
    });
  });

  it('should throw an error if password is not available', () => {
    const req: Request = authMockReq({}, { username: USERNAME, password: '' }) as Request;
    const res: Response = authMoqRes();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Password is a required field');
    });
  });

  it('should throw an error if password length is less than minimum length', () => {
    const req: Request = authMockReq({}, { username: USERNAME, password: WRONG_PASSWORD }) as Request;
    const res: Response = authMoqRes();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Invalid password');
    });
  });

  it('should throw an error if password length is greater than maximum length', () => {
    const req: Request = authMockReq({}, { username: USERNAME, password: LONG_PASSWORD }) as Request;
    const res: Response = authMoqRes();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Invalid password');
    });
  });

  it('should throw "Invalid credentials" if username does not exist', () => {
    const req: Request = authMockReq({}, { username: USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMoqRes();
    jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValueOnce(null as any);

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(authService.getAuthUserByUsername).toHaveBeenCalledWith(Helpers.firstLetterUppercase(req.body.username));
      expect(error.statusCode).toEqual(401);
      expect(error.serializeErrors().messsage).toEqual('Invalid credentials');
    });
  });

  it('should throw "Invalid credentials" if password does not exist', () => {
    const req: Request = authMockReq({}, { username: USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMoqRes();
    jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValueOnce(null as any);

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(authService.getAuthUserByUsername).toHaveBeenCalledWith(Helpers.firstLetterUppercase(req.body.username));
      expect(error.statusCode).toEqual(401);
      expect(error.serializeErrors().messsage).toEqual('Invalid credentials');
    });
  });

  it('should set session data for valid credentials and send correct json response', async () => {
    const req: Request = authMockReq({}, { username: USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMoqRes();
    authMock.comparePassword = () => Promise.resolve(true);
    jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValue(authMock);
    jest.spyOn(userService, 'getUserByAuthId').mockResolvedValue(mergedAuthAndUserData);

    await SignIn.prototype.read(req, res);
    expect(req.session?.jwt).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User login successfully',
      user: mergedAuthAndUserData,
      token: req.session?.jwt
    });
  });
});
