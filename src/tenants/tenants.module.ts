import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { Tenant } from './entities/tenant.entity';
import { Subscription } from './entities/subscription.entity';
import { DeviceSession } from './entities/device-session.entity';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { DeviceCatalogModule } from '../device-catalog/device-catalog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Customer, Subscription, DeviceSession]),
    DeviceCatalogModule,
  ],
  controllers: [TenantsController, SubscriptionController],
  providers: [TenantsService, SubscriptionService],
  exports: [TenantsService, SubscriptionService],
})
export class TenantsModule {}
