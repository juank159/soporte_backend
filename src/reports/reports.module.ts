import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ServiceOrder } from '../orders/entities/service-order.entity';
import { OrderHistory } from '../orders/entities/order-history.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder, OrderHistory, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
