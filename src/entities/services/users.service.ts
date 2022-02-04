// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { Collection, ObjectId } from "mongodb";
import { User } from '@pestras/stores-sales-core/auth';
import { DBService } from "src/global/services/db.service";
import { DocStatus, Document } from "@pestras/stores-sales-core/document";
import { ID, oid } from "src/util/types";
import { UserGroup, UserRole } from "@pestras/stores-sales-core/auth/roles";
import { Profile } from "@pestras/stores-sales-core/common";

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private collection: Collection<User<ObjectId>>;

  constructor(private readonly dbService: DBService) {}

  onApplicationBootstrap() {
    this.collection = this.dbService.db.collection(User.Collection);
  }

  get(excludeId: ID, group: UserGroup, projection?: any) {
    return this.collection.find({ 
      _id: { $ne: oid(excludeId) },
      "role.group": { $gt: group } 
    }, { projection }).toArray();
  }

  getById(id: ID, group?: UserGroup, projection?: { [key: string]: number }) {
    return this.collection.findOne({ 
      _id: oid(id),
      status: DocStatus.ACTIVE,
      "role.group": { $gt: group ?? -1 }
    }, { projection });
  }

  getByUsername(username: string) {
    return this.collection.findOne({ username, status: DocStatus.ACTIVE });
  }

  async hasOwner() {
    return (await this.collection.countDocuments({ 'role.group': UserGroup.OWNER })) > 0
  }

  async getUserSocketById(userId: ID) {
    let user = await this.collection.findOne({ _id: oid(userId) }, { projection: { _id: 0, socket: 1 } });

    return user?.socket;
  }

  updateUserSocket(userId: ID, socket: string) {
    this.collection.updateOne({ _id: oid(userId) }, { $set: { socket } });
  }

  async userIdExists(id: ID) {
    return (await this.collection.countDocuments({ _id: oid(id) })) > 0;
  }

  async usernameExists(username: string) {
    return (await this.collection.countDocuments({ username, status: DocStatus.ACTIVE })) > 0;
  }

  async create(user: User<ObjectId>) {
    return (await this.collection.insertOne(user)).insertedId;
  }

  async updateProfile(userId: ID, profile: Profile, by = userId) {
    const signature = Document.createUpdateSignature(oid(by));

    await this.collection.updateOne({ _id: oid(userId) }, {
      $set: {
        profile,
        ...signature
      }
    });

    return signature;
  }

  async updateUsername(userId: ID, username: string, by = userId) {
    const signature = Document.createUpdateSignature(oid(by));

    await this.collection.updateOne({ _id: oid(userId) }, { $set: { username, ...signature } });

    return signature;
  }

  async changeRole(userId: ID, role: UserRole<ObjectId>, by: ID) {
    const signature = Document.createUpdateSignature(oid(by));

    await this.collection.updateOne({ _id: oid(userId) }, { 
      $set: { role, ...signature } 
    });

    return signature;
  }

  async delete(userId: ID, by: ID) {
    const sig = Document.createDeleteSignature(oid(by));
    await this.collection.updateOne({ _id: oid(userId) }, { $set: { status: DocStatus.INACTIVE, ...sig } });
    return sig;
  }
}