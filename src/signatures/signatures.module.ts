import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignaturesService } from './signatures.service';
import { SignaturesController } from './signatures.controller';
import { Signature } from './entities/signature.entity';
import { ServiceOrder } from '../orders/entities/service-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Signature, ServiceOrder])],
  controllers: [SignaturesController],
  providers: [SignaturesService],
  exports: [SignaturesService],
})
export class SignaturesModule {}
