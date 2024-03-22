import { Request, Response } from 'express';
import * as cloudinary from '@global/helpers/cloudinary-upload';
import { authMock, authMockReq, authMoqRes } from '@mocks/auth.mock';
import { SignUp } from '../signup';
import { CustomError } from '@global/helpers/error-handler';
import { authService } from '@services/db/auth.service';
import { UserCache } from '@services/redis/user.cache';

jest.mock('@services/queues/base.queue');
jest.mock('@services/queues/user.queue');
jest.mock('@services/queues/auth.queue');
jest.mock('@services/redis/user.cache');
jest.mock('@global/helpers/cloudinary-upload');

describe('Signup', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if username is not available', async () => {
    const req: Request = authMockReq(
      {},
      {
        username: '',
        email: 'test@gmail.com',
        password: '1234567',
        avatarColor: '#ffff',
        avatarImage: 'https://test.com'
      }
    ) as Request;
    const res: Response = authMoqRes();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.serializeErrors().messsage).toEqual('Username is a required field');
      expect(error.statusCode).toEqual(400);
    });
  });

  it('should throw an error if username is less then minimun length', async () => {
    const req: Request = authMockReq(
      {},
      {
        username: 'spy',
        email: 'test@gmail.com',
        password: '1234567',
        avatarColor: '#ffff',
        avatarImage: 'https://test.com'
      }
    ) as Request;
    const res: Response = authMoqRes();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.serializeErrors().messsage).toEqual('Invalid username');
      expect(error.statusCode).toEqual(400);
    });
  });

  it('should throw an error if email is not valid', async () => {
    const req: Request = authMockReq(
      {},
      {
        username: 'spyman',
        email: 'not valid',
        password: '1234567',
        avatarColor: '#ffff',
        avatarImage: 'https://test.com'
      }
    ) as Request;
    const res: Response = authMoqRes();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.serializeErrors().messsage).toEqual('Email must be valid');
      expect(error.statusCode).toEqual(400);
    });
  });

  it('should throw an error if email is missing', async () => {
    const req: Request = authMockReq(
      {},
      {
        username: 'spyman',
        email: '',
        password: '1234567',
        avatarColor: '#ffff',
        avatarImage: 'https://test.com'
      }
    ) as Request;
    const res: Response = authMoqRes();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.serializeErrors().messsage).toEqual('Email is a required field');
      expect(error.statusCode).toEqual(400);
    });
  });

  it('should throw an error if password is missing', async () => {
    const req: Request = authMockReq(
      {},
      {
        username: 'spyman',
        email: 'spyman@gmail.com',
        password: '',
        avatarColor: '#ffff',
        avatarImage: 'https://test.com'
      }
    ) as Request;
    const res: Response = authMoqRes();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.serializeErrors().messsage).toEqual('Password is a required field');
      expect(error.statusCode).toEqual(400);
    });
  });

  it('should throw an error if password length is less then required', async () => {
    const req: Request = authMockReq(
      {},
      {
        username: 'spyman',
        email: 'spyman@gmail.com',
        password: '123',
        avatarColor: '#ffff',
        avatarImage: 'https://test.com'
      }
    ) as Request;
    const res: Response = authMoqRes();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.serializeErrors().messsage).toEqual('Invalid password');
      expect(error.statusCode).toEqual(400);
    });
  });

  it('should throw an authorized error if user already exists', async () => {
    const req: Request = authMockReq(
      {},
      {
        username: 'Manny',
        email: 'manny@me.com',
        password: '1234567',
        avatarColor: '#9c27b0',
        avatarImage: 'https://test.com'
      }
    ) as Request;
    const res: Response = authMoqRes();

    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(authMock);

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.serializeErrors().messsage).toEqual('Invalid credentials');
      expect(error.statusCode).toEqual(401);
    });
  });

  it('should create a new user with valid credentials and send back a correct json response', async () => {
    const req: Request = authMockReq(
      {},
      {
        username: 'spyman',
        email: 'spyman@me.com',
        password: '1234567',
        avatarColor: '#9c27b0',
        avatarImage: 'https://test.com'
      }
    ) as Request;
    const res: Response = authMoqRes();

    const userSpy = jest.spyOn(UserCache.prototype, 'saveUserToCache');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(null as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cloudinary, 'uploads').mockResolvedValue({ public_id: '1' } as any);

    await SignUp.prototype.create(req, res);
    expect(req.session?.jwt).toBeDefined();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Created',
      user: userSpy.mock.calls[0][2],
      token: req.session?.jwt
    });
  });
});
