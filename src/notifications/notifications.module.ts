import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ServiceOrder } from '../orders/entities/service-order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder, Customer, Tenant])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
