import { AuthPayload, IAuthDocument } from '@auth/interfaces/auth.interface';
import { Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authMockReq = (sessionData: IJWT, body: IAuthMock, currentUser?: AuthPayload | null, params?: any) => ({
  session: sessionData,
  body,
  params,
  currentUser
});

export const authMoqRes = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export interface IJWT {
  jwt?: string;
}

export interface IAuthMock {
  _id?: string;
  username?: string;
  email?: string;
  uId?: string;
  password?: string;
  avatarColor?: string;
  avatarImage?: string;
  createdAt?: Date | string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  quote?: string;
  work?: string;
  school?: string;
  location?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  messages?: boolean;
  reactions?: boolean;
  comments?: boolean;
  follows?: boolean;
}

export const authUserPayload: AuthPayload = {
  userId: '60263f14648fed5246e322d9',
  uId: '1621613119252066',
  username: 'Manny',
  email: 'manny@me.com',
  avatarColor: '#9c27b0',
  iat: 12345
};

export const authUserPayload2: AuthPayload = {
  userId: '65f060a14feaaea37dc2fa84',
  uId: '1621613119252066',
  username: 'Manny',
  email: 'manny@me.com',
  avatarColor: '#9c27b0',
  iat: 12345
};

export const authMock = {
  _id: '60263f14648fed5246e322d3',
  uId: '1621613119252066',
  username: 'Manny',
  email: 'manny@me.com',
  avatarColor: '#9c27b0',
  createdAt: '2022-08-31T07:42:24.451Z',
  password: '12345678',
  save: () => {},
  comparePassword: () => false
} as unknown as IAuthDocument;

export const signUpMockData = {
  _id: '65f060a14feaaea37dc2fa83',
  username: 'Manny',
  email: 'manny@me.com',
  uId: '670986261367',
  password: '12345678',
  avatarColor: '#fffffff',
  avatarImage: '',
  createdAt: new Date(),
  currentPassword: '12345678',
  newPassword: '1234567',
  confirmPassword: '1234567',
  quote: '',
  work: '',
  school: '',
  location: '',
  facebook: '',
  instagram: '',
  twitter: '',
  youtube: '',
  messages: true,
  reactions: true,
  comments: true,
  follows: true
};
