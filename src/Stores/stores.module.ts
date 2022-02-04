// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Module } from "@nestjs/common";
import { StoresControllers } from "./controllers/stores.controller";

@Module({
  controllers: [StoresControllers]
})
export class StoresModule {}