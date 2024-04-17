import { Application } from 'express';

import { authRoutes } from '@auth/routes/authRoutes';
import { serverAdapter } from '@services/queues/base.queue';
import { currentRoutes } from '@auth/routes/currentRoutes';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { postRoutes } from '@post/routes/postRoutes';
import { reactionRoutes } from '@reactions/routes/reactionRoutes';
import { commentRoutes } from '@comments/routes/commentRoutes';
import { followerRoutes } from '@followers/routes/followerRoutes';
import { notificationRoutes } from '@notifications/routes/notificationRoutes';
import { imageRoutes } from '@images/routes/imagesRoutes';
import { chatRoutes } from '@chat/routes/chatRoutes';
import { userRoutes } from '@user/routes/userRoutes';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());
    app.use(BASE_PATH, authMiddleware.verifyUser, currentRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, followerRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, notificationRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, imageRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, chatRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, userRoutes.routes());
  };

  routes();
};
