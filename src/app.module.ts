import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { EntitiesModule } from './entities/entities.module';
import { GlobalModule } from './global/global.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './Stores/stores.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { AllExceptionFilter } from './util/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ verboseMemoryLeak: true, wildcard: true }),
    GlobalModule,
    EntitiesModule,
    AuthModule,
    SuppliersModule,
    StoresModule,
    ProductsModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
      inject: [HttpAdapterHost, ConfigService]
    }
  ],
})
export class AppModule {}
