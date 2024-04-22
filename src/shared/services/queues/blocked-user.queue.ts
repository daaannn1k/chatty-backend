import { IBlockedUserJobData } from '@followers/interfaces/follower.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { blockedUserWorker } from '@workers/blocked.worker';

class BlockedUserQueue extends BaseQueue {
  constructor() {
    super('blockedUser');
    this.processJob('addBlockedUserToDB', 5, blockedUserWorker.addBlockedUserToDB);
    this.processJob('removeBlockedUserFromDB', 5, blockedUserWorker.addBlockedUserToDB);
  }

  public addBlockedUserJob(name: string, data: IBlockedUserJobData): void {
    this.addJob(name, data);
  }
}

export const blockedUserQueue: BlockedUserQueue = new BlockedUserQueue();
