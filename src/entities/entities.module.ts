// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./services/auth.service";
import { ProductsOptionsService } from "./services/products-options.service";
import { ProductsService } from "./services/products.service";
import { StoresService } from "./services/stores.service";
import { SuppliersService } from "./services/suppliers.service";
import { UsersService } from "./services/users.service";

@Global()
@Module({
  imports: [JwtModule.register({ signOptions: { expiresIn: '7d' } })],
  providers: [
    AuthService,
    UsersService,
    SuppliersService,
    StoresService,
    ProductsService,
    ProductsOptionsService
  ],
  exports: [
    AuthService,
    UsersService,
    SuppliersService,
    StoresService,
    ProductsService,
    ProductsOptionsService
  ]
})
export class EntitiesModule {}