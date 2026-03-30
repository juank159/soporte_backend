import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ServiceOrder } from './entities/service-order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPhoto } from './entities/order-photo.entity';
import { OrderHistory } from './entities/order-history.entity';
import { Device } from '../devices/entities/device.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceOrder, OrderItem, OrderPhoto, OrderHistory, Device]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
