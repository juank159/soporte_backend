import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { ServiceOrder } from '../orders/entities/service-order.entity';
import { OrderHistory } from '../orders/entities/order-history.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder, OrderHistory, Tenant])],
  controllers: [PublicController],
})
export class PublicModule {}
