// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserSession } from "@pestras/stores-sales-core/auth";
import { AuthService } from "src/entities/services/auth.service";
import { UsersService } from "src/entities/services/users.service";
import { HttpReq } from "src/util/types";
import { TOKEN_METHOD } from "../interfaces";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<HttpReq>();
    const token = request.headers.authorization?.split(' ')[1] || null;

    if (!token)
      throw new UnauthorizedException("tokenRequired");

    const { _id, method } = this.authService.verifyToken(token);

    if (method !== TOKEN_METHOD.DEFAULT_AUTH)
      throw new UnauthorizedException("invalidTokenMethod");

    const user = await this.usersService.getById(_id);

    if (!user)
      throw new UnauthorizedException("invalidToken");

    request.session = new UserSession(user, token);

    return true;
  }
}