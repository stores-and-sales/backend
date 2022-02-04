// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Body, Controller, ForbiddenException, Param, ParseIntPipe, Post, UnauthorizedException } from "@nestjs/common";
import { User, UserSession } from "@pestras/stores-sales-core/auth";
import { InitAppReqBody, LoginReqBody } from '@pestras/stores-sales-core/auth/crud';
import { UserHash } from "@pestras/stores-sales-core/auth/hash";
import { UserGroup } from "@pestras/stores-sales-core/auth/roles";
import { Profile } from "@pestras/stores-sales-core/common";
import { ObjectId } from "mongodb";
import { AuthService } from "src/entities/services/auth.service";
import { UsersService } from "src/entities/services/users.service";
import { ValidallPipe } from "src/global/pipes/validall.pipe";
import { Session } from "../decorators/session.param";
import { TOKEN_METHOD } from "../interfaces";
import { AuthValidators } from "../validators/auth.validators";

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) { }

  @Post('init')
  async init(@Body(new ValidallPipe(AuthValidators.INIT_APP)) body: InitAppReqBody) {
    if (await this.usersService.hasOwner())
      throw new ForbiddenException("initNotAllowed");

    const { hash, salt } = await this.authService.hashPassword(body.password);

    const id = await this.usersService.create(new User<ObjectId>({
      username: body.username,
      role: { group: UserGroup.OWNER, store: null },
      profile: new Profile(body.profile)
    }));

    await this.authService.create(new UserHash<ObjectId>({
      user: id,
      password: hash,
      salt,
      createdBy: id
    }));

    return true;
  }

  @Post('signin/:group')
  async OwnerSignin(
    @Param('group', ParseIntPipe) group: UserGroup,
    @Body(new ValidallPipe(AuthValidators.LOGIN)) body: LoginReqBody
  ) {
    const user = await this.usersService.getByUsername(body.username);

    if (!user)
      throw new UnauthorizedException("CheckUsernameOrPassword");

    if (group !== (user.role.group === UserGroup.VIEWER ? UserGroup.OWNER : user.role.group))
      throw new UnauthorizedException("unauthorizedRole");

    if (user.role.group !== UserGroup.OWNER)
      throw new UnauthorizedException("unauthorizedRole");

    if (!(await this.authService.verifyPassword(user._id, body.password)))
      throw new UnauthorizedException("CheckUsernameOrPassword");

    return new UserSession(user, this.authService.createToken({ _id: user._id.toHexString(), method: TOKEN_METHOD.DEFAULT_AUTH }));
  }

  @Post('verify/:group')
  async verify(
    @Session() session: UserSession<ObjectId>,
    @Param('group', ParseIntPipe) group: UserGroup
  ) {
    if (group !== (session.role.group === UserGroup.VIEWER ? UserGroup.ADMIN : session.role.group))
      throw new UnauthorizedException("unauthorizedRole");

    const newToken = this.authService.createToken({ _id: session._id.toHexString(), method: TOKEN_METHOD.DEFAULT_AUTH });
    session.token = newToken;

    return session;
  }
}