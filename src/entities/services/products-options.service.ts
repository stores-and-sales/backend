// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { DocStatus, Document } from "@pestras/stores-sales-core/document";
import { AddProductOptionReqBody, UpdateProductOptionReqBody } from "@pestras/stores-sales-core/product/crud";
import { ProductOption } from "@pestras/stores-sales-core/product/product-option";
import { Collection, ObjectId } from "mongodb";
import { DBService } from "src/global/services/db.service";
import { ID, oid } from "src/util/types";

@Injectable()
export class ProductsOptionsService implements OnApplicationBootstrap {
  private collection: Collection<ProductOption<ObjectId>>;

  constructor(private readonly dbService: DBService) {}

  onApplicationBootstrap() {
    this.collection = this.dbService.db.collection(ProductOption.Collection);
  }

  get() {
    return this.collection.find({}).toArray();
  }

  getByProduct(productId: ID) {
    return this.collection.find({ product: oid(productId) }).toArray();
  }

  getById(id: ID) {
    return this.collection.findOne({ _id: oid(id) });
  }

  async idExists(id: ID) {
    return (await this.collection.countDocuments({ _id: oid(id) })) > 0;
  }

  async nameExists(name: string, productId: ID) {
    return (await this.collection.countDocuments({ name, product: oid(productId) })) > 0;
  }

  async create(option: ProductOption<ObjectId>) {
    return (await this.collection.insertOne(option)).insertedId;
  }

  async update(id: ID, update: UpdateProductOptionReqBody, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne(
      { _id: oid(id) },
      { $set: { name: update.name, type: update.type, ...sig } }
    );

    return sig;
  }

  async addOptionValue(id: ID, value: any, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne(
      { _id: oid(id) },
      { $push: { list: { _id: oid(), value } }, $set: sig }
    );

    return sig;
  }

  async updateOptionValue(id: ID, valueId: ID,  value: any, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne(
      { _id: oid(id), 'list._id': oid(valueId) },
      { $set: { 'list.$.value': value }, ...sig }
    );

    return sig;
  }

  async deleteOptionValue(id: ID, valueId: ID, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne(
      { _id: oid(id) },
      { $pull: { 'list._id': oid(valueId) }, $set: sig }
    );

    return sig;
  }

  async deleteOption(id: ID, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne(
      { _id: oid(id) }, { $set: { status: DocStatus.INACTIVE, ...sig } }
    );

    return sig;
  }
}