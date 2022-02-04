// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Validall } from "@pestras/validall";
import { CommonValidators } from "src/util/validators";

export enum AuthValidators {
  INIT_APP = 'InitApp',
  LOGIN = 'Login'
}

new Validall(AuthValidators.INIT_APP, {
  username: { $type: 'string', $required: true, $message: 'invalidUsername' },
  password: { $type: 'string', $required: true, $message: 'invalidPassword' },
  profile: { $ref: CommonValidators.PROFILE }
});

new Validall(AuthValidators.LOGIN, {
  username: { $type: 'string', $required: true, $message: 'invalidUsername' },
  password: { $type: 'string', $required: true, $message: 'invalidPassword' }
});

