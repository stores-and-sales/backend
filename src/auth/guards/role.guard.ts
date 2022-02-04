// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserGroup } from "@pestras/stores-sales-core/auth/roles";
import { HttpReq } from "src/util/types";

export const Groups = (...groups: UserGroup[]) => SetMetadata('groups', groups);

@Injectable()
export class RoleGuard implements CanActivate {

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const groups = this.reflector.get<UserGroup[]>('groups', context.getHandler());
    const request = context.switchToHttp().getRequest<HttpReq>();
    const session = request.session;

    if (!groups?.length)
      return true;

    if (groups.includes(session.role.group))
      return true;

    return false;
  }
}