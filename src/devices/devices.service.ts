import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

  async create(tenantId: string, dto: CreateDeviceDto) {
    const device = this.devicesRepository.create({ ...dto, tenantId });
    return this.devicesRepository.save(device);
  }

  async findOne(tenantId: string, id: string) {
    const device = await this.devicesRepository.findOne({
      where: { id, tenantId },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async findAll(tenantId: string) {
    return this.devicesRepository.find({ where: { tenantId } });
  }
}
