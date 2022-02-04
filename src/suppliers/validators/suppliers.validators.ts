// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Validall } from "@pestras/validall";
import { SupplierType } from '@pestras/stores-sales-core/supplier';
import { CommonValidators } from "src/util/validators";

export enum SuppliersValidators {
  CREATE = 'CreateSupplier',
  UPDATE = 'UpdateSupplier'
}

new Validall(SuppliersValidators.CREATE, {
  name: { $type: 'string', $required: true, $message: 'invalidSupplierName' },
  address: { $type: 'string', $default: '', $message: 'invalidSupplierAddress' },
  type: { $type: 'number', $inRange: [SupplierType.FACTORY, SupplierType.SUPPLIER], $default: 0 },
  contacts: { $default: [], $each: { $ref: CommonValidators.PROFILE } }
});

new Validall(SuppliersValidators.UPDATE, {
  $ref: SuppliersValidators.CREATE
});