import express, { Express } from 'express';

import { ChattyServer } from '@root/setupServer';
import databaseConnection from '@root/setupDatabase';
import { config } from '@root/config';
import Logger from 'bunyan';

const log: Logger = config.createLogger('app');

class Application {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app);

    server.start();
    Application.handleExit();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.configCloudinary();
  }

  private static handleExit(): void {
    process.on('uncaughtException', (error: Error) => {
      log.error(`There was an uncaught error ${error}`);
      Application.shutDownProperly(1);
    });

    process.on('unhandledRejection', (reason: Error, promise) => {
      log.error(`Unhandled rejection at promise ${promise} with reason: ${reason}`);
      Application.shutDownProperly(2);
    });

    process.on('SIGTERM', () => {
      log.error('Caught SIGTERM');
      Application.shutDownProperly(2);
    });

    process.on('SIGINT', () => {
      log.error('Caught SIGINT');
      Application.shutDownProperly(2);
    });

    process.on('exit', () => {
      log.error('Exiting');
    });
  }

  private static shutDownProperly(exitCode: number): void {
    Promise.resolve()
      .then(() => {
        log.info('Shut down complete');
        process.exit(exitCode);
      })
      .catch((error) => {
        log.error(`Error during shut down ${error}`);
        process.exit(1);
      });
  }
}

const application: Application = new Application();
application.initialize();
