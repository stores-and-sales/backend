import { Global, Module } from "@nestjs/common";
import { AccountsController } from "./controllers/account.controller";
import { AuthController } from "./controllers/auth.controller";
import { UsersController } from "./controllers/users.controller";
import { AuthGuard } from "./guards/auth.guard";
import { RoleGuard } from "./guards/role.guard";

@Global()
@Module({
  controllers: [
    AuthController,
    AccountsController,
    UsersController
  ],
  providers: [
    AuthGuard,
    RoleGuard    
  ],
  exports: [
    AuthGuard,
    RoleGuard
  ]
})
export class AuthModule {}