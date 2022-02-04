// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BadRequestException, Body, ConflictException, Controller, Get, Param, Post, Put, UnauthorizedException, UseGuards } from "@nestjs/common";
import { User, UserSession } from "@pestras/stores-sales-core/auth";
import { ChangePasswordReqBody, ChangeUsernameReqBody, CreateUserReqBody, UpdateProfileReqBody } from "@pestras/stores-sales-core/auth/crud";
import { UserHash } from "@pestras/stores-sales-core/auth/hash";
import { UserGroup } from "@pestras/stores-sales-core/auth/roles";
import { SystemEventPayload } from "@pestras/stores-sales-core/common";
import { ObjectId } from "mongodb";
import { NotFoundError } from "rxjs";
import { AuthService } from "src/entities/services/auth.service";
import { UsersService } from "src/entities/services/users.service";
import { ValidallPipe } from "src/global/pipes/validall.pipe";
import { EventsService } from "src/global/services/events.service";
import { oid } from "src/util/types";
import { Session } from "../decorators/session.param";
import { AuthGuard } from "../guards/auth.guard";
import { RoleGuard, Groups } from "../guards/role.guard";
import { AccountValidators } from "../validators/acccount.validators";
import { UsersValidators } from "../validators/users.validators";

@Controller('users')
@UseGuards(AuthGuard, RoleGuard)
export class UsersController {

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventsService
  ) { }

  @Get()
  async get(@Session() session: UserSession<ObjectId>) {
    return await this.usersService.get(session._id, session.role.group);
  }

  @Get('userId')
  async getById(
    @Session() session: UserSession<ObjectId>,
    @Param('userId') userId: string
  ) {
    return await this.usersService.getById(userId, session.role.group);
  }

  @Post("")
  @Groups(UserGroup.OWNER, UserGroup.ADMIN)
  async create(
    @Session() session: UserSession<ObjectId>,
    @Body(new ValidallPipe(UsersValidators.CREATE_USER)) body: CreateUserReqBody
  ) {
    if (session.role.group > body.role.group)
      throw new UnauthorizedException("unauthorizedRole");

    if (body.role.group > UserGroup.ADMIN && !body.role.store)
      throw new BadRequestException("storeRequired");

    if (await this.usersService.usernameExists(body.username))
      throw new ConflictException("usernameAlreadyExists");

    const { hash, salt } = this.authService.hashPassword(body.password);

    const user = new User<ObjectId>({
      username: body.username,
      role: { group: body.role.group, store: body.role.store ? oid(body.role.store) : null },
      profile: body.profile,
      createdBy: session._id
    });

    user._id = await this.usersService.create(user);

    await this.authService.create(new UserHash<ObjectId>({
      user: user._id,
      password: hash,
      salt,
      createdBy: session._id
    }));

    const event: SystemEventPayload = {
      name: 'broadcast.users.create',
      issuer: session._id.toHexString(),
      rooms: ["Owner"],
      payload: user._id.toHexString()
    };

    if (body.role.group > UserGroup.ADMIN) {
      event.rooms.push("Admins");

      if (body.role.group === UserGroup.CASHIER) {
        event.stores = [body.role.store];
        event.rooms.push("Managers");
      }
    }

    this.eventEmitter.emit(event);

    return user;
  }

  @Put('change-username/:userId')
  @Groups(UserGroup.OWNER, UserGroup.ADMIN)
  async changeUsername(
    @Session() session: UserSession<ObjectId>,
    @Param("userId") userId: string,
    @Body(new ValidallPipe(AccountValidators.CHANGE_USERNAME)) body: ChangeUsernameReqBody
  ) {
    const user = await this.usersService.getById(userId, session.role.group, { role: 1 });

    if (!user)
      throw new NotFoundError("userNotResolved");

    if (user.role.group <= session.role.group)
      throw new UnauthorizedException("UnauthorizedRole");

    if (await this.usersService.usernameExists(body.username))
      throw new ConflictException("usernameAlreadyExists");

    const sig = await this.usersService.updateUsername(user._id, body.username, session._id);

    const event: SystemEventPayload = {
      name: 'broadcast.users.update.username',
      issuer: session._id.toHexString(),
      rooms: ["Owner"],
      payload: { id: user._id.toHexString(), username: body.username, signature: sig }
    };

    if (user.role.group > UserGroup.ADMIN) {
      event.rooms.push("Admins");

      if (user.role.group === UserGroup.CASHIER) {
        event.stores = [user.role.store.toHexString()];
        event.rooms.push("Managers");
      }
    }

    return sig;
  }

  @Put('change-password/:userId')
  @Groups(UserGroup.OWNER, UserGroup.ADMIN)
  async changePassword(
    @Session() session: UserSession<ObjectId>,
    @Param("userId") userId: string,
    @Body(new ValidallPipe(AccountValidators.CHANGE_PASSWORD)) body: ChangePasswordReqBody
  ) {
    const user = await this.usersService.getById(userId, session.role.group, { role: 1 });

    if (!user)
      throw new NotFoundError("userNotResolved");

    if (user.role.group <= session.role.group)
      throw new UnauthorizedException("UnauthorizedRole");

    if (!(await this.authService.verifyPassword(session._id, body.currPassword)))
      throw new UnauthorizedException("wrongPassword");

    await this.authService.setNewPassword(user._id, body.newPassword, session._id);

    return true;
  }

  @Put('update-profile/:userId')
  @Groups(UserGroup.OWNER, UserGroup.ADMIN)
  async updateProfile(
    @Session() session: UserSession<ObjectId>,
    @Param("userId") userId: string,
    @Body(new ValidallPipe(AccountValidators.UPDATE_PROFILE)) body: UpdateProfileReqBody
  ) {
    const user = await this.usersService.getById(userId, session.role.group, { role: 1 });

    if (!user)
      throw new NotFoundError("userNotResolved");

    if (user.role.group <= session.role.group)
      throw new UnauthorizedException("UnauthorizedRole");

    const sig = await this.usersService.updateProfile(user._id, body.profile, session._id);

    const event: SystemEventPayload = {
      name: 'broadcast.users.update.profile',
      issuer: session._id.toHexString(),
      rooms: ["Owner"],
      payload: { id: user._id.toHexString(), profile: body.profile, signature: sig }
    };

    if (user.role.group > UserGroup.ADMIN) {
      event.rooms.push("Admins");

      if (user.role.group === UserGroup.CASHIER) {
        event.stores = [user.role.store.toHexString()];
        event.rooms.push("Managers");
      }
    }

    return sig;
  }

  @Put('userId')
  @Groups(UserGroup.OWNER, UserGroup.ADMIN)
  async delete(
    @Session() session: UserSession<ObjectId>,
    @Param("userId") userId: string
  ) {
    const user = await this.usersService.getById(userId, session.role.group, { role: 1 });

    if (!user)
      throw new NotFoundError("userNotResolved");

    if (user.role.group <= session.role.group)
      throw new UnauthorizedException("UnauthorizedRole");

    const sig = await this.usersService.delete(user._id, session._id);

    const event: SystemEventPayload = {
      name: 'broadcast.users.delete.profile',
      issuer: session._id.toHexString(),
      rooms: ["Owner"],
      payload: { id: user._id.toHexString(), signature: sig }
    };

    if (user.role.group < UserGroup.ADMIN) {
      event.rooms.push("Admins");

      if (user.role.group === UserGroup.CASHIER) {
        event.stores = [user.role.store.toHexString()];
        event.rooms.push("Managers");
      }
    }

    return sig;
  }
}