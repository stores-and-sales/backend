// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { Collection, ObjectId, ReturnDocument } from "mongodb";
import { Product, ProductProperty } from "@pestras/stores-sales-core/product";
import { AddProductProperty, UpdateProductProperty, UpdateProductReqBody } from "@pestras/stores-sales-core/product/crud";
import { DBService } from "src/global/services/db.service";
import { ID, oid } from "src/util/types";
import { GetSerial } from "src/util/serials";
import { DocStatus, Document } from "@pestras/stores-sales-core/document";

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  collection: Collection<Product<ObjectId>>;

  constructor(private readonly dbService: DBService) { }

  onApplicationBootstrap() {
    this.collection = this.dbService.db.collection(Product.Collection);
  }

  private async createSerial() {
    while (true) {
      let serial = GetSerial();

      if ((await this.collection.countDocuments({ serial })) === 0)
        return serial;
    }
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

  async create(product: Product<ObjectId>) {
    product.serial = await this.createSerial();
    return (await this.collection.insertOne(product)).insertedId;
  }

  async update(id: ID, update: UpdateProductReqBody, issuer: ID) {
    return (
      await this.collection.findOneAndUpdate(
        { _id: oid(id) },
        { $set: { ...update, ...Document.createUpdateSignature(oid(issuer)) } },
        { returnDocument: ReturnDocument.AFTER }
      )
    ).value;
  }

  async addImg(id: ID, src: string, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne({ _id: oid(id) }, { $push: { imgs: src }, $set: sig });

    return sig;
  }

  async removeImg(id: ID, src: string, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne({ _id: oid(id) }, { $pull: { imgs: src }, $set: sig });

    return sig;
  }

  async addProperty(id: ID, property: AddProductProperty, issuer: ID) {
    const _id = oid();
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne(
      { _id: oid(id) },
      {
        $push: { properties: { _id, ...property } },
        $set: sig
      }
    );

    return { _id, signature: sig };
  }

  async updateProperty(id: ID, propertyId: ID, property: UpdateProductProperty, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne(
      { _id: oid(id), 'properites._id': oid(propertyId) },
      { $set: { 'properties.$': property, ...sig } }
    );

    return sig;
  }

  async deleteProperty(id: ID, propertyId: ID, issuer: ID) {
    const sig = Document.createUpdateSignature(oid(issuer));

    await this.collection.updateOne(
      { _id: oid(id) }, { $pull: { 'properties._id': oid(propertyId) } }
    );

    return sig;
  }

  async delete(id: ID, issuer: ID) {
    const sig = Document.createDeleteSignature(oid(issuer));

    await this.collection.updateOne({ _id: oid(id) }, { $set: { status: DocStatus.INACTIVE, ...sig } });

    return sig;
  }
}