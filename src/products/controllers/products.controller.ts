// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { UserSession } from "@pestras/stores-sales-core/auth";
import { UserGroup } from "@pestras/stores-sales-core/auth/roles";
import { Product, ProductProperty } from "@pestras/stores-sales-core/product";
import { AddProductProperty, CreateProductReqBody, UpdateProductProperty, UpdateProductReqBody } from "@pestras/stores-sales-core/product/crud";
import { ObjectId } from "mongodb";
import { Session } from "src/auth/decorators/session.param";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { Groups, RoleGuard } from "src/auth/guards/role.guard";
import { ProductsService } from "src/entities/services/products.service";
import { ValidallPipe } from "src/global/pipes/validall.pipe";
import { EventsService } from "src/global/services/events.service";
import { ProductsValidators } from "../validators/products..validators";

@Controller('products')
@UseGuards(AuthGuard, RoleGuard)
export class ProductsController {

  constructor(
    private readonly service: ProductsService,
    private readonly eventsService: EventsService
  ) { }

  @Get()
  @Groups(UserGroup.OWNER, UserGroup.VIEWER, UserGroup.STORE_MANAGER, UserGroup.CASHIER)
  async get() {
    return await this.service.get();
  }

  @Get(':id')
  @Groups(UserGroup.OWNER, UserGroup.VIEWER, UserGroup.STORE_MANAGER, UserGroup.CASHIER)
  async getById(@Param('id') id: string) {
    return await this.service.getById(id);
  }

  @Post()
  @Groups(UserGroup.STORE_MANAGER)
  async create(
    @Session() session: UserSession<ObjectId>,
    @Body(new ValidallPipe(ProductsValidators.CREATE)) body: CreateProductReqBody
  ) {
    if (await this.service.nameExists(body.name))
      throw new ConflictException("nameAlreadyExists");

    const product = new Product<ObjectId>({
      name: body.name,
      description: body.description,
      tags: body.tags,
      price: body.price,
      createdBy: session._id
    });

    product._id = await this.service.create(product);

    this.eventsService.emit({
      name: 'broadcast.products.create',
      issuer: session._id.toHexString(),
      rooms: ['Owner', 'Managers', 'Cashiers'],
      payload: product._id.toHexString()
    });

    return product;
  }

  @Put(':id')
  @Groups(UserGroup.STORE_MANAGER)
  async update(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string,
    @Body(new ValidallPipe(ProductsValidators.UPDATE)) body: UpdateProductReqBody
  ) {
    if (await this.service.nameExists(body.name, id))
      throw new ConflictException("nameAlreadyExists");

    const product = await this.service.update(id, body, session._id);

    this.eventsService.emit({
      name: 'broadcast.products.update',
      issuer: session._id.toHexString(),
      rooms: ['Owner', 'Managers', 'Cashiers'],
      payload: product._id.toHexString()
    });

    return product;
  }

  @Post(':id/properties')
  @Groups(UserGroup.STORE_MANAGER)
  async addProperty(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string,
    @Body(new ValidallPipe(ProductsValidators.ADD_PROPERTY)) body: AddProductProperty
  ) {
    const ret = await this.service.addProperty(id, body, session._id);

    this.eventsService.emit({
      name: 'broadcast.products.create.property',
      issuer: session._id.toHexString(),
      rooms: ['Owner', 'Managers', 'Cashiers'],
      payload: id
    });

    return ret;
  }

  @Put(':id/properties/:propId')
  @Groups(UserGroup.STORE_MANAGER)
  async updateProperty(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string,
    @Param('propId') propId: string,
    @Body(new ValidallPipe(ProductsValidators.UPDATE_PROPERTY)) body: UpdateProductProperty
  ) {
    if (!(await this.service.idExists(id)))
      throw new BadRequestException("productNotResolved");

    const product = await this.service.getById(id, { properties: 1 });

    if (product.properties.findIndex((p: ProductProperty<ObjectId>) => p._id.toHexString() === propId) === -1)
      throw new BadRequestException("ProductPropertyNotResolved");

    const ret = await this.service.updateProperty(id, propId, body, session._id);

    this.eventsService.emit({
      name: 'broadcast.products.update.properties',
      rooms: ['Owner', 'Managers', 'Cashiers'],
      issuer: session._id.toHexString(),
      payload: {
        id,
        property: { _id: propId, ...body },
        signature: ret
      }
    });

    return ret;
  }

  @Delete(':id/properties/:propId')
  @Groups(UserGroup.STORE_MANAGER)
  async deleteProperty(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string,
    @Param('propId') propId: string
  ) {
    if (!(await this.service.idExists(id)))
      throw new BadRequestException("productNotResolved");

    const ret = await this.service.deleteProperty(id, propId, session._id);

    this.eventsService.emit({
      name: 'broadcast.products.delete.properties',
      rooms: ['Owner', 'Managers', 'Cashiers'],
      issuer: session._id.toHexString(),
      payload: { id, propId, signature: ret }
    })

    return ret;
  }

  @Post(':id/imgs')
  @Groups(UserGroup.STORE_MANAGER)
  async addImage(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string
  ) {

  }

  @Delete(':id/imgs')
  @Groups(UserGroup.STORE_MANAGER)
  async deleteImage(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string
  ) {

  }

  @Delete(':id')
  @Groups(UserGroup.STORE_MANAGER)
  async delete(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string
  ) {
    const ret = await this.service.delete(id, session._id);

    this.eventsService.emit({
      name: 'broadcast.products.delete',
      rooms: ['Owner', 'Managers', 'Cashiers'],
      issuer: session._id.toHexString(),
      payload: { id, signature: ret }
    });

    return ret;
  }
}