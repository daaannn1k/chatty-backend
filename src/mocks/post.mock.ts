import { AuthPayload } from '@auth/interfaces/auth.interface';
import { Response } from 'express';
import mongoose from 'mongoose';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';
import { IPostDocument } from '@post/interfaces/post.interface';

export const postMockRequest = (body: IBody, currentUser?: AuthPayload | null, params?: IParams) => ({
  body,
  params,
  currentUser
});

export const postMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

interface IParams {
  postId?: string;
  page?: string;
}

interface IBody {
  bgColor: string;
  post?: string;
  gifUrl?: string;
  image?: string;
  privacy?: string;
  imgId?: string;
  imgVersion?: string;
  profilePicture?: string;
  feelings?: string;
}

export const newPost: IBody = {
  bgColor: '#f44336',
  post: 'how are you?',
  gifUrl: '',
  imgId: '',
  imgVersion: '',
  image: '',
  privacy: 'Public',
  profilePicture: 'http://place-hold.it/500x500',
  feelings: 'happy'
};

export const postMockData: IPostDocument = {
  _id: new mongoose.Types.ObjectId('6027f77087c9d9ccb1555268'),
  userId: mergedAuthAndUserData._id,
  username: mergedAuthAndUserData.username,
  email: mergedAuthAndUserData.email,
  avatarColor: mergedAuthAndUserData.avatarColor,
  profilePicture: mergedAuthAndUserData.profilePicture,
  post: 'how are you?',
  bgColor: '#f44336',
  imgId: '',
  imgVersion: '',
  feelings: 'happy',
  gifUrl: '',
  privacy: 'Public',
  commentsCount: 0,
  createdAt: new Date(),
  reactions: {
    like: 0,
    love: 0,
    happy: 0,
    wow: 0,
    sad: 0,
    angry: 0
  }
} as unknown as IPostDocument;

export const updatedPost = {
  profilePicture: postMockData.profilePicture,
  post: postMockData.post,
  bgColor: postMockData.bgColor,
  feelings: 'wow',
  privacy: 'Private',
  gifUrl: '',
  imgId: '',
  imgVersion: '',
  videoId: '',
  videoVersion: ''
};

export const updatedPostMockData: IPostDocument = {
  _id: new mongoose.Types.ObjectId('6027f77087c9d9ccb1555268'),
  userId: mergedAuthAndUserData._id,
  username: mergedAuthAndUserData.username,
  email: mergedAuthAndUserData.email,
  avatarColor: mergedAuthAndUserData.avatarColor,
  profilePicture: mergedAuthAndUserData.profilePicture,
  post: 'how are you?',
  bgColor: '#f44336',
  imgId: '',
  imgVersion: '',
  feelings: 'wow',
  gifUrl: '',
  privacy: 'Private',
  commentsCount: 0,
  createdAt: new Date(),
  reactions: {
    like: 0,
    love: 0,
    happy: 0,
    wow: 0,
    sad: 0,
    angry: 0
  }
} as unknown as IPostDocument;

export const updatedPostWithImage = {
  profilePicture: postMockData.profilePicture,
  post: 'Wonderful',
  bgColor: postMockData.bgColor,
  feelings: 'wow',
  privacy: 'Private',
  gifUrl: '',
  imgId: '',
  imgVersion: '',
  image: ''
};
