// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Validall } from "@pestras/validall";
import { StoreType } from '@pestras/stores-sales-core/store';
import { CommonValidators } from "src/util/validators";

export enum StoresValidators {
  CREATE = 'CreateStore',
  UPDATE = 'UpdateStore'
}

new Validall(StoresValidators.CREATE, {
  name: { $type: 'string', $required: true, $message: 'invalidStoreName' },
  address: { $type: 'string', $default: '', $message: 'invalidStoreAddress' },
  type: { $type: 'number', $inRange: [StoreType.STORE, StoreType.SHOP], $default: 0 },
  contacts: { $default: [], $each: { $ref: CommonValidators.PROFILE } }
});

new Validall(StoresValidators.UPDATE, {
  $ref: StoresValidators.CREATE
});