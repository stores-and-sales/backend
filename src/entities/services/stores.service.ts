// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { Collection, ObjectId, ReturnDocument } from "mongodb";
import { Store } from '@pestras/stores-sales-core/store';
import { UpdateStoreReqBody } from '@pestras/stores-sales-core/store/crud';
import { DBService } from "src/global/services/db.service";
import { ID, oid } from "src/util/types";
import { DocStatus, Document } from "@pestras/stores-sales-core/document";

@Injectable()
export class StoresService implements OnApplicationBootstrap {
  collection: Collection<Store<ObjectId>>;

  constructor(private readonly dbService: DBService) {}

  onApplicationBootstrap() {
    this.collection = this.dbService.db.collection(Store.Collection);
  }

  async idExists(id: ID) {
    return (await this.collection.countDocuments({ _id: oid(id) })) > 0;
  }

  async nameExists(name: string, excludedId?: ID) {
    return (await this.collection.countDocuments({ name, _id: { $ne: oid(excludedId) } })) > 0;
  }

  get() {
    return this.collection.find({}).toArray();
  }

  getById(id: ID, projection?: any) {
    return this.collection.findOne({ _id: oid(id) }, { projection });
  }

  async create(store: Store<ObjectId>) {
    return (await this.collection.insertOne(store)).insertedId;
  }

  async update(id: ID, update: UpdateStoreReqBody, issuer: ID) {
    return (await this.collection.findOneAndUpdate(
      { _id: oid(id) },
      { $set: { ...update, ...Document.createUpdateSignature(oid(issuer)) } },
      { returnDocument: ReturnDocument.AFTER }
    )).value;
  }

  async delete(id: ID, issuer: ID) {
    return (await this.collection.updateOne(
      { _id: oid(id) }, 
      { $set: { status: DocStatus.INACTIVE, ...Document.createDeleteSignature(oid(issuer)) } }
    )).acknowledged;
  }
} 