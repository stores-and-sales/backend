// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { UserSession } from "@pestras/stores-sales-core/auth";
import { UserGroup } from "@pestras/stores-sales-core/auth/roles";
import { Supplier } from "@pestras/stores-sales-core/supplier";
import { CreateSupplierReqBody, UpdateSupplierReqBody } from "@pestras/stores-sales-core/supplier/crud";
import { ObjectId } from "mongodb";
import { Session } from "src/auth/decorators/session.param";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { Groups, RoleGuard } from "src/auth/guards/role.guard";
import { SuppliersService } from "src/entities/services/suppliers.service";
import { ValidallPipe } from "src/global/pipes/validall.pipe";
import { EventsService } from "src/global/services/events.service";
import { SuppliersValidators } from "../validators/suppliers.validators";

@Controller("suppliers")
@UseGuards(AuthGuard, RoleGuard)
export class SupplersController {

  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly eventsService: EventsService
  ) {}

  @Get()
  @Groups(UserGroup.OWNER, UserGroup.STORE_MANAGER, UserGroup.VIEWER)
  async get() {
    return await this.suppliersService.get();
  }

  @Get(':id')
  @Groups(UserGroup.OWNER, UserGroup.STORE_MANAGER, UserGroup.VIEWER)
  async getById(@Param("id") id: string) {
    return await this.suppliersService.getById(id);
  }

  @Post()
  @Groups(UserGroup.STORE_MANAGER)
  async create(
    @Session() session: UserSession<ObjectId>,
    @Body(new ValidallPipe(SuppliersValidators.CREATE)) body: CreateSupplierReqBody
  ) {
    if (await this.suppliersService.nameExists(body.name))
      throw new ConflictException("nameAlreadyExists");

    const supplier = new Supplier<ObjectId>({
      ...body,
      createdBy: session._id
    });
    
    supplier._id = await this.suppliersService.create(supplier);

    this.eventsService.emit({
      name: 'broadcast.supplers.create',
      issuer: session._id.toHexString(),
      rooms: ['Managers', 'Owner'],
      payload: supplier._id
    });

    return supplier;
  }

  @Put(':id')
  @Groups(UserGroup.STORE_MANAGER)
  async update(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string,
    @Body(new ValidallPipe(SuppliersValidators.UPDATE)) body: UpdateSupplierReqBody
  ) {
    if (!(await this.suppliersService.idExists(id)))
      throw new BadRequestException("supplierNotResoleved");

    if (await this.suppliersService.nameExists(body.name, id))
      throw new ConflictException("nameAlreadyExists");

    const supplier = await this.suppliersService.update(id, body, session._id);

    this.eventsService.emit({
      name: 'broadcast.supplers.update',
      issuer: session._id.toHexString(),
      rooms: ['Managers', 'Owner'],
      payload: supplier._id
    });

    return supplier;
  }

  @Delete(':id')
  @Groups(UserGroup.STORE_MANAGER)
  async delete(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string
  ) {
    await this.suppliersService.delete(id, session._id);

    this.eventsService.emit({
      name: 'broadcast.supplers.delete',
      issuer: session._id.toHexString(),
      rooms: ['Managers', 'Owner'],
      payload: id
    });

    return true;
  }
}