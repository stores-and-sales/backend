// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Module } from "@nestjs/common";
import { SupplersController } from "./controllers/suppliers.controller";

@Module({
  controllers: [SupplersController]
})
export class SuppliersModule {}