import { INotificationJobData } from '@notifications/interfaces/notification.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { notificationWorker } from '@workers/notification.worker';

class NotificationQueue extends BaseQueue {
  constructor() {
    super('notifications');
    this.processJob('updateNotificationInDB', 5, notificationWorker.updateNotificationInDB);
    this.processJob('deleteNotificationFromDB', 5, notificationWorker.deleteNotificationFromDB);
  }

  public addNotificationJob(name: string, data: INotificationJobData): void {
    this.addJob(name, data);
  }
}

export const notificationQueue: NotificationQueue = new NotificationQueue();
