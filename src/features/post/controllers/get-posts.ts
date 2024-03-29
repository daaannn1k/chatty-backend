import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { IPostDocument } from '@post/interfaces/post.interface';
import { PostCache } from '@services/redis/post.cache';
import { postService } from '@services/db/post.service';

const postCache: PostCache = new PostCache();
const PAGE_SIZE = 10;

export class Get {
  public async posts(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = PAGE_SIZE * (parseInt(page) - 1);
    const limit: number = PAGE_SIZE * parseInt(page); //TO THINK ABOUT IT;
    const newSkip: number = skip === 0 ? skip : skip + 1;
    let posts: IPostDocument[] = [];
    let totalPosts = 0;
    const cachedPosts: IPostDocument[] = await postCache.getPostsFromCache('post', newSkip, limit);

    if (cachedPosts.length) {
      posts = cachedPosts;
      totalPosts = await postCache.getTotalPostsInCache(); //TO THINK ABOUT IT;
    } else {
      posts = await postService.getPosts({}, skip, limit, { createdAt: -1 });
      totalPosts = await postService.postsCount(); //TO THINK ABOUT IT;
    }
    res.status(HTTP_STATUS.OK).json({ message: 'All posts', posts, totalPosts });
  }

  public async postsWithImages(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = PAGE_SIZE * (parseInt(page) - 1);
    const limit: number = PAGE_SIZE * parseInt(page); //TO THINK ABOUT IT;
    const newSkip: number = skip === 0 ? skip : skip + 1;
    let posts: IPostDocument[] = [];
    const cachedPosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache('post', newSkip, limit);

    posts = cachedPosts.length ? cachedPosts : await postCache.getPostsWithImagesFromCache('post', newSkip, limit);
    res.status(HTTP_STATUS.OK).json({ message: 'All posts with images', posts });
  }
}
