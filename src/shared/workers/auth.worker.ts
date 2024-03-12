import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

import { config } from '@root/config';
import { authService } from '@services/db/auth.service';

const log: Logger = config.createLogger('authWorker');

class AuthWorker {
  async addAuthUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { value } = job.data;
      console.log(value);
      //add method to send data to database
      await authService.createAuthUser(value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const authWorker: AuthWorker = new AuthWorker();
