import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter as createPostgresAdapter } from '@socket.io/postgres-adapter';
import { createAdapter as createRedisAdapter } from '@socket.io/redis-adapter';

import { ServerOptions } from 'socket.io';
import { DataSource } from 'typeorm';
import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver.js';
import { parseRedisConfig } from '../config';
import { Redis } from 'ioredis';

export class WebSocketAdapter extends RedisWebSocketAdapter;

export class PostgresWebSocketAdapter extends IoAdapter {
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    const pool = (this.app.get(DataSource).driver as PostgresDriver).master;
    server.adapter(createPostgresAdapter(pool));
    return server;
  }
}

export class RedisWebSocketAdapter extends IoAdapter {

  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const pubClient = new Redis(parseRedisConfig());
    pubClient.on('error', (error) => {
      this.logger.error(`Redis pubClient: ${error}`);
    });
    const subClient = pubClient.duplicate();
    subClient.on('error', (error) => {
      this.logger.error(`Redis subClient: ${error}`);
    });
    const server = super.createIOServer(port, options);
    server.adapter(createRedisAdapter(pubClient, subClient));
    return server;
  }
}
