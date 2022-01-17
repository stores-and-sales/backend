// Copyright (c) 2021 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Request } from 'express';
import { UserSession } from '@pestras/stores-sales-core/auth';
import { SystemEvent, SystemEventPayload } from '@pestras/stores-sales-core/common';
import { ObjectId } from 'mongodb';

export interface HttpReq extends Request {
  session: UserSession<ObjectId>;
}

export type ID = string | ObjectId;

export function oid(id?: ID) {
  return new ObjectId(id);
}

export function Event<T = any>(event: SystemEventPayload<ID, T>) {
  return new SystemEvent<ID, T>(event);
}