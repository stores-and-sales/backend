// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export function GetSerial() {
  return Math.floor(Math.random() * (1000000000 - 100000000) + 100000000);
}