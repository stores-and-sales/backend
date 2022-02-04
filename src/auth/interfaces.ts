// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export enum TOKEN_METHOD {
  DEFAULT_AUTH,
  ACTIVATION,
  RESET_PASSWORD
}

export interface TokenPayload<T = any> {
  _id: string;
  method: TOKEN_METHOD;
  data?: T;
}