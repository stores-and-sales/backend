// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BeforeApplicationShutdown, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class DBService implements OnModuleInit, BeforeApplicationShutdown {
  private readonly logger = new Logger('DatabaseService');
  private conn: MongoClient;

  public db: Db;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    if (!this.configService.get<string>('DATABASE_URL'))
      throw new Error("database connection string was not provided");

    this.conn = await MongoClient.connect(this.configService.get<string>('DATABASE_URL'), { loggerLevel: 'warn' });

    this.logger.debug("connected to databse successfully");
    this.db = this.conn.db();
  }

  beforeApplicationShutdown(signal?: string) {
    if (!!this.conn) {
      this.conn.close();
      this.logger.warn("disconnected from database");
    }
  }
}