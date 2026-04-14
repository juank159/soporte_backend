import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { DevicesModule } from './devices/devices.module';
import { OrdersModule } from './orders/orders.module';
import { SignaturesModule } from './signatures/signatures.module';
import { PrintersModule } from './printers/printers.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DeviceCatalogModule } from './device-catalog/device-catalog.module';
import { PublicModule } from './public/public.module';
import { StorageModule } from './storage/storage.module';
import { DeviceType } from './device-catalog/entities/device-type.entity';
import { DeviceBrand } from './device-catalog/entities/device-brand.entity';

import { Tenant } from './tenants/entities/tenant.entity';
import { Subscription } from './tenants/entities/subscription.entity';
import { DeviceSession } from './tenants/entities/device-session.entity';
import { User } from './users/entities/user.entity';
import { Customer } from './customers/entities/customer.entity';
import { Device } from './devices/entities/device.entity';
import { ServiceOrder } from './orders/entities/service-order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { OrderPhoto } from './orders/entities/order-photo.entity';
import { Signature } from './signatures/entities/signature.entity';
import { Printer } from './printers/entities/printer.entity';
import { AuditLog } from './common/entities/audit-log.entity';
import { OrderHistory } from './orders/entities/order-history.entity';
import { OrderEquipment } from './orders/entities/order-equipment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'soporte_admin'),
        password: configService.get('DB_PASSWORD', 'soporte_secret_2024'),
        database: configService.get('DB_NAME', 'soporte_saas'),
        entities: [
          Tenant,
          User,
          Customer,
          Device,
          ServiceOrder,
          OrderItem,
          OrderPhoto,
          Signature,
          Printer,
          AuditLog,
          OrderHistory,
          OrderEquipment,
          DeviceType,
          DeviceBrand,
          Subscription,
          DeviceSession,
        ],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    AuthModule,
    TenantsModule,
    UsersModule,
    CustomersModule,
    DevicesModule,
    OrdersModule,
    SignaturesModule,
    PrintersModule,
    ReportsModule,
    NotificationsModule,
    DeviceCatalogModule,
    StorageModule,
    PublicModule,
  ],
})
export class AppModule {}
