import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceCatalogService } from './device-catalog.service';
import { DeviceCatalogController } from './device-catalog.controller';
import { DeviceType } from './entities/device-type.entity';
import { DeviceBrand } from './entities/device-brand.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceType, DeviceBrand])],
  controllers: [DeviceCatalogController],
  providers: [DeviceCatalogService],
  exports: [DeviceCatalogService],
})
export class DeviceCatalogModule {}
