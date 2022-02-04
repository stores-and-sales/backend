// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserSession } from "@pestras/stores-sales-core/auth";
import { ObjectId } from "mongodb";

export const Session = createParamDecorator<UserSession<ObjectId>>(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().session
)