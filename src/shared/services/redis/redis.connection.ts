import { BaseCache } from '@services/redis/base.cache';

class RedisConnection extends BaseCache {
  constructor() {
    super('redisConnection');
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      const res = await this.client.ping();
      this.log.info('RES', res);
      this.log.info('IS REDIS CLIENT OPEN:', this.client.isOpen);
    } catch (error) {
      this.log.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
