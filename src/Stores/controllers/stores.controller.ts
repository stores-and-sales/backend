// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { UserSession } from "@pestras/stores-sales-core/auth";
import { UserGroup } from "@pestras/stores-sales-core/auth/roles";
import { Store } from "@pestras/stores-sales-core/store";
import { CreateStoreReqBody, UpdateStoreReqBody } from "@pestras/stores-sales-core/store/crud";
import { ObjectId } from "mongodb";
import { Session } from "src/auth/decorators/session.param";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { Groups, RoleGuard } from "src/auth/guards/role.guard";
import { StoresService } from "src/entities/services/stores.service";
import { ValidallPipe } from "src/global/pipes/validall.pipe";
import { EventsService } from "src/global/services/events.service";
import { StoresValidators } from "../validators/stores.validators";

@Controller('stores')
@UseGuards(AuthGuard, RoleGuard)
export class StoresControllers {

  constructor(
    private readonly storesService: StoresService,
    private readonly eventsService: EventsService
  ) {}

  @Get()
  @Groups(UserGroup.OWNER, UserGroup.STORE_MANAGER, UserGroup.VIEWER, UserGroup.ADMIN)
  async get() {
    return await this.storesService.get();
  }

  @Get(':id')
  async getById(@Param("id") id: string) {
    return await this.storesService.getById(id);
  }

  @Post()
  @Groups(UserGroup.OWNER)
  async create(
    @Session() session: UserSession<ObjectId>,
    @Body(new ValidallPipe(StoresValidators.CREATE)) body: CreateStoreReqBody
  ) {
    if (await this.storesService.nameExists(body.name))
      throw new ConflictException("nameAlreadyExists");

    const store = new Store<ObjectId>({
      ...body,
      createdBy: session._id
    });
    
    store._id = await this.storesService.create(store);

    this.eventsService.emit({
      name: 'broadcast.stores.create',
      issuer: session._id.toHexString(),
      rooms: ['Admins', 'Owner'],
      payload: store._id
    });

    return store;
  }

  @Put(':id')
  @Groups(UserGroup.OWNER)
  async update(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string,
    @Body(new ValidallPipe(StoresValidators.UPDATE)) body: UpdateStoreReqBody
  ) {
    if (!(await this.storesService.idExists(id)))
      throw new BadRequestException("storeNotResoleved");

    if (await this.storesService.nameExists(body.name, id))
      throw new ConflictException("nameAlreadyExists");

    const store = await this.storesService.update(id, body, session._id);

    this.eventsService.emit({
      name: 'broadcast.stores.update',
      issuer: session._id.toHexString(),
      rooms: ['Managers', 'Owner', 'Admins'],
      payload: store._id
    });

    return store;
  }

  @Delete(':id')
  @Groups(UserGroup.OWNER)
  async delete(
    @Session() session: UserSession<ObjectId>,
    @Param('id') id: string
  ) {
    await this.storesService.delete(id, session._id);

    this.eventsService.emit({
      name: 'broadcast.stores.delete',
      issuer: session._id.toHexString(),
      rooms: ['Managers', 'Owner', 'Admins'],
      payload: id
    });

    return true;
  }
}