// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Collection, ObjectId } from "mongodb";
import { UserHash } from '@pestras/stores-sales-core/auth/hash';
import { DBService } from "src/global/services/db.service";
import { ID, oid } from "src/util/types";
import { createHmac, randomBytes } from "crypto";
import { TokenPayload } from "../interfaces";
import { Document, DocStatus } from "@pestras/stores-sales-core/document";

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private collection: Collection<UserHash<ObjectId>>;

  constructor(
    private readonly dbService: DBService,
    private readonly config: ConfigService,
    private jwt: JwtService
  ) { }

  onApplicationBootstrap() {
    this.collection = this.dbService.db.collection(UserHash.Collection);
  }

  getUserHash(id: ID) {
    return this.collection.findOne({ user: oid(id) });
  }

  hashPassword(password: string) {
    const salt = randomBytes(8).toString('hex').slice(0, 16);
    const hash = createHmac('sha512', salt).update(password).digest('hex');

    return { salt, hash };
  }

  async verifyPassword(userId: ID, password: string) {
    const hash = await this.collection.findOne({ user: oid(userId) }, { projection: { _id: 0, password: 1, salt: 1 } });

    return hash.password === createHmac('sha512', hash.salt).update(password).digest('hex');
  }

  create(hash: UserHash<ObjectId>) {
    return this.collection.insertOne(hash);
  }

  setNewPassword(userId: ID, newPassword: string, by = userId) {
    const { hash, salt } = this.hashPassword(newPassword);

    return this.collection.updateOne({ user: oid(userId) }, { $set: { password: hash, salt, updatedAt: new Date().getTime(), updatedBy: oid(by) } })
  }

  createToken(payload: TokenPayload) {
    return this.jwt.sign(payload, { secret: this.config.get<string>("TOKEN_SECRET") });
  }

  verifyToken<T>(token: string): TokenPayload<T> {
    return this.jwt.verify<TokenPayload>(token, { secret: this.config.get<string>("TOKEN_SECRET") });
  }

  async delete(userId: ID, by = userId) {
    const sig = Document.createDeleteSignature(oid(by));

    await this.collection.updateOne({ userId: oid(userId) }, { $set: { status: DocStatus.INACTIVE, ...sig }});
    
    return sig;
  }
}