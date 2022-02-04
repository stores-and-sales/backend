// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Body, ConflictException, Controller, Put, UnauthorizedException, UseGuards } from "@nestjs/common";
import { UserSession } from "@pestras/stores-sales-core/auth";
import { ChangePasswordReqBody, ChangeUsernameReqBody, UpdateProfileReqBody } from "@pestras/stores-sales-core/auth/crud";
import { UserGroup } from "@pestras/stores-sales-core/auth/roles";
import { SystemEventPayload } from "@pestras/stores-sales-core/common";
import { ObjectId } from "mongodb";
import { AuthService } from "src/entities/services/auth.service";
import { UsersService } from "src/entities/services/users.service";
import { ValidallPipe } from "src/global/pipes/validall.pipe";
import { EventsService } from "src/global/services/events.service";
import { Session } from "../decorators/session.param";
import { AuthGuard } from "../guards/auth.guard";
import { AccountValidators } from "../validators/acccount.validators";

@Controller('accounts')
@UseGuards(AuthGuard)
export class AccountsController {

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventsService
  ) { }

  @Put('change-username')
  async changeUsername(
    @Session() session: UserSession<ObjectId>,
    @Body(new ValidallPipe(AccountValidators.CHANGE_USERNAME)) body: ChangeUsernameReqBody
  ) {
    if (await this.usersService.usernameExists(body.username))
      throw new ConflictException("usernameAlreadyExists");

    const sig = await this.usersService.updateUsername(session._id, body.username);

    if (session.role.group !== UserGroup.OWNER) {
      const event: SystemEventPayload = {
        name: 'broadcast.users.update.username',
        issuer: session._id.toHexString(),
        rooms: ["Admins"],
        payload: {
          id: session._id,
          username: body.username,
          signature: sig
        }
      }

      if (session.role.group === UserGroup.CASHIER) {
        event.rooms.push("Managers");
        event.stores = [session.role.store.toHexString()]
      }

      this.eventEmitter.emit(event);
    }

    return sig;
  }

  @Put('change-password')
  async changePassword(
    @Session() session: UserSession<ObjectId>,
    @Body(new ValidallPipe(AccountValidators.CHANGE_PASSWORD)) body: ChangePasswordReqBody
  ) {
    if (!(await this.authService.verifyPassword(session._id, body.currPassword)))
      throw new UnauthorizedException("wrongPassword");

    await this.authService.setNewPassword(session._id, body.newPassword);

    return true;
  }

  @Put('update-profile')
  async updateProfile(
    @Session() session: UserSession<ObjectId>,
    @Body(new ValidallPipe(AccountValidators.UPDATE_PROFILE)) body: UpdateProfileReqBody
  ) {
    const sig = this.usersService.updateProfile(session._id, body.profile);

    if (session.role.group !== UserGroup.OWNER) {
      const event: SystemEventPayload = {
        name: 'broadcast.users.update.profile',
        issuer: session._id.toHexString(),
        rooms: ["Admins"],
        payload: {
          id: session._id,
          profile: body.profile,
          signature: sig
        }
      }

      if (session.role.group === UserGroup.CASHIER) {
        event.rooms.push("Managers");
        event.stores = [session.role.store.toHexString()]
      }

      this.eventEmitter.emit(event);
    }

    return sig;
  }
}