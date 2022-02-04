// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { UserGroup } from "@pestras/stores-sales-core/auth/roles";
import { Validall } from "@pestras/validall";
import { CommonValidators } from "src/util/validators";

export enum UsersValidators {
  CREATE_USER = 'CreateUser'
}

new Validall(UsersValidators.CREATE_USER, {
  username: { $type: 'string', $required: true, $regex: /^[a-zA-Z][a-zA-Z0-9]{5,25}$/, $message: 'invalidUsername' },
  password: { $type: 'string', $length: { $gte: 6 }, $required: true, $message: 'invalidPassword' },
  profile: { $ref: CommonValidators.PROFILE },
  role: {
    $required: true,
    $message: "userRoleRequired",
    $props: {
      group: { $type: 'number', $inRange: [UserGroup.VIEWER, UserGroup.CASHIER], $required: true, $message: 'invalidUserGroup' },
      store: { $type: 'string', $nullable: true, $message: 'invalidStoreValue' }
    }
  }
});