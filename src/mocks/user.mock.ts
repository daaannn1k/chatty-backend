import { IUserDocument } from '@user/interfaces/user.interace';

export const mergedAuthAndUserData: IUserDocument = {
  _id: '65f060a14feaaea37dc2fa84',
  authId: '60263f14648fed5246e322d3',
  username: 'Manny',
  email: 'manny@me.com',
  password: 'manny1',
  avatarColor: '#9c27b0',
  uId: '1621613119252066',
  postsCount: 0,
  work: '',
  school: '',
  quote: '',
  location: '',
  blocked: [],
  blockedBy: [],
  followersCount: 0,
  followingCount: 0,
  notifications: {
    messages: false,
    reactions: false,
    comments: false,
    follows: false
  },
  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  },
  bgImageVersion: '',
  bgImageId: '',
  profilePicture: '',
  createdAt: '2022-08-31T07:42:24.451Z'
} as unknown as IUserDocument;

export const existingUserTwo = {
  _id: '6064861bc25eaa5a5d2f9bf4',
  authId: '60263f14648fed5246e322dd',
  username: 'Danny',
  email: 'danny@me.com',
  password: 'danny1',
  avatarColor: '#9c27b0',
  uId: '1621613119252067',
  postsCount: 10,
  work: '',
  school: '',
  quote: '',
  location: '',
  blocked: [],
  blockedBy: [],
  followersCount: 0,
  followingCount: 0,
  notifications: {
    messages: false,
    reactions: true,
    comments: true,
    follows: false
  },
  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  },
  bgImageVersion: '',
  bgImageId: '',
  profilePicture: '',
  createdAt: '2022-08-31T07:42:24.451Z'
} as unknown as IUserDocument;

export const searchedUserMock = {
  profilePicture: 'http://place-hold.it/500x500',
  _id: '60263f14648fed5246e322d5',
  uId: '1621613119252062',
  username: 'Kenny',
  email: 'ken@me.com',
  avatarColor: '#9c27b1'
};

export const userJwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
