import { IAuthJob } from '@auth/interfaces/auth.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { IUserJob } from '@user/interfaces/user.interace';
import { userWorker } from '@workers/user.worker';

class UserQueue extends BaseQueue {
  constructor() {
    super('user');
    this.processJob('addUserToDB', 5, userWorker.addUserToDB);
    this.processJob('updateUserInfoInDB', 5, userWorker.updateUserInfoInDB);
    this.processJob('updateUserLinksInDB', 5, userWorker.updateUserLinksInDB);
    this.processJob('updateNotificationSettings', 5, userWorker.updateNotificationSettings);
  }

  public addUserJob(name: string, data: IAuthJob | IUserJob): void {
    this.addJob(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
