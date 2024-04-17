import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { UserCache } from '@services/redis/user.cache';
import { PostCache } from '@services/redis/post.cache';
import { FollowersCache } from '@services/redis/follower.cache';
import { IAllUsers, IUserDocument } from '@user/interfaces/user.interace';
import { userService } from '@services/db/user.service';
import { IFollowerData } from '@followers/interfaces/follower.interface';
import { followerService } from '@services/db/follower.service';
import mongoose from 'mongoose';
import { Helpers } from '@global/helpers/helpers';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postService } from '@services/db/post.service';

interface IUserAll {
  newSkip: number;
  limit: number;
  skip: number;
  userId: string;
}

const userCache: UserCache = new UserCache();
const postCache: PostCache = new PostCache();
const followersCache: FollowersCache = new FollowersCache();

const PAGE_SIZE = 12;

export class Get {
  public async all(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = PAGE_SIZE * (parseInt(page) - 1);
    const limit: number = PAGE_SIZE * parseInt(page); //TO THINK ABOUT IT;
    const newSkip: number = skip === 0 ? skip : skip + 1;
    const allUsers = await Get.prototype.allUsers({
      newSkip,
      limit,
      skip,
      userId: `${req.currentUser?.userId}`
    });

    const followers: IFollowerData[] = await Get.prototype.followers(`${req.currentUser!.userId}`);

    res.status(HTTP_STATUS.OK).json({ message: 'Get users', users: allUsers.users, totalUsers: allUsers.totalUsers, followers });
  }

  public async profile(req: Request, res: Response): Promise<void> {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${req.currentUser!.userId}`);

    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile', user: existingUser });
  }

  public async profileById(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${userId}`)) as IUserDocument;
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${userId}`);

    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile by id', user: existingUser });
  }

  public async profileAndPosts(req: Request, res: Response): Promise<void> {
    const { userId, username, uId } = req.params;
    const userName: string = Helpers.firstLetterUppercase(username);
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${userId}`)) as IUserDocument;
    const cachedUserPosts: IPostDocument[] = await postCache.getPostsByUserFromCache('post', parseInt(uId, 10));
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${userId}`);
    const userPosts: IPostDocument[] = cachedUserPosts.length
      ? cachedUserPosts
      : await postService.getPosts({ username: userName }, 0, 100, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile and posts', user: existingUser, posts: userPosts });
  }

  public async randomUserSuggestions(req: Request, res: Response): Promise<void> {
    let randomUsers: IUserDocument[] = [];
    const cachedRandomUsers: IUserDocument[] = (await userCache.getRandomUsersFromCache(
      `${req.currentUser?.userId}`,
      req.currentUser!.username
    )) as IUserDocument[];
    randomUsers = cachedRandomUsers.length ? cachedRandomUsers : await userService.getRandomUsers(`${req.currentUser!.userId}`);

    res.status(HTTP_STATUS.OK).json({ message: 'User suggestions', users: randomUsers });
  }

  private async allUsers({ newSkip, limit, skip, userId }: IUserAll): Promise<IAllUsers> {
    let users;
    let type = '';
    const cachedUsers: IUserDocument[] | null = await userCache.getUsersFromCache(newSkip, limit, userId);
    if (cachedUsers?.length) {
      type = 'redis';
      users = cachedUsers;
    } else {
      type = 'mongodb';
      users = await userService.getAllUsers(userId, skip, PAGE_SIZE); //TO CHECK IT!!!!
    }

    const totalUsers: number = await Get.prototype.usersCount(type, userId);
    return { users, totalUsers };
  }

  private async usersCount(type: string, userId: string): Promise<number> {
    let total;
    if (type === 'redis') {
      total = await userCache.getTotalUsersFromCache(userId);
    } else {
      total = await userService.getAllUsersInDB(userId);
    }

    return total;
  }

  private async followers(userId: string): Promise<IFollowerData[]> {
    const cachedFollowers: IFollowerData[] = await followersCache.getFollowersFromCache(`followers:${userId}`);
    const result = cachedFollowers.length ? cachedFollowers : await followerService.getFollowerData(new mongoose.Types.ObjectId(userId));

    return result;
  }
}
