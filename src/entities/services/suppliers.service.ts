// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { DocStatus, Document } from "@pestras/stores-sales-core/document";
import { Supplier } from "@pestras/stores-sales-core/supplier";
import { UpdateSupplierReqBody } from "@pestras/stores-sales-core/supplier/crud";
import { Collection, ObjectId, ReturnDocument } from "mongodb";
import { DBService } from "src/global/services/db.service";
import { ID, oid } from "src/util/types";

@Injectable()
export class SuppliersService implements OnApplicationBootstrap {
  private collection: Collection<Supplier<ObjectId>>;

  constructor(private readonly dbService: DBService) { }

  onApplicationBootstrap() {
    this.collection = this.dbService.db.collection(Supplier.Collection);
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

  async create(supplier: Supplier<ObjectId>) {
    return (await this.collection.insertOne(supplier)).insertedId;
  }

  async update(id: ID, update: UpdateSupplierReqBody, issuer: ID) {
    return (await this.collection.findOneAndUpdate(
      { _id: oid(id) },
      { $set: { ...update, ...Document.createUpdateSignature(oid(issuer)) } },
      { returnDocument: ReturnDocument.AFTER }
    )).value;
  }

  async delete(id: ID, issuer: ID) {
    return (await this.collection.updateOne(
      { _id: oid(id) }, 
      { $set: { status: DocStatus.INACTIVE, ...Document.createDeleteSignature(oid(issuer))} }
    )).acknowledged;
  }
}