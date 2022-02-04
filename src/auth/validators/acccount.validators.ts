// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Validall } from "@pestras/validall";
import { CommonValidators } from "src/util/validators";

export enum AccountValidators {
  CHANGE_USERNAME = "ChangeUsername",
  CHANGE_PASSWORD = "ChangePassword",
  UPDATE_PROFILE = "UpdateProfile"
}

new Validall(AccountValidators.CHANGE_USERNAME, {
  username: { $type: 'string', $required: true, $message: 'invalidUsername' }
});

new Validall(AccountValidators.CHANGE_PASSWORD, {
  currPassword: { $type: 'string', $required: true, $message: 'invalidCurrentPassword' },
  newPassword: { $type: 'string', $length: { $gte: 6 }, $required: true, $message: 'invalidPassword' }
});

new Validall(AccountValidators.UPDATE_PROFILE, {
  profile: { $required: true, $ref: CommonValidators.PROFILE }
});