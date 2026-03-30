import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceType } from './entities/device-type.entity';
import { DeviceBrand } from './entities/device-brand.entity';
import {
  CreateDeviceTypeDto,
  UpdateDeviceTypeDto,
  CreateDeviceBrandDto,
  UpdateDeviceBrandDto,
} from './dto/device-catalog.dto';

@Injectable()
export class DeviceCatalogService {
  constructor(
    @InjectRepository(DeviceType)
    private typesRepo: Repository<DeviceType>,
    @InjectRepository(DeviceBrand)
    private brandsRepo: Repository<DeviceBrand>,
  ) {}

  // ---- DEVICE TYPES ----

  async createType(tenantId: string, dto: CreateDeviceTypeDto) {
    const type = this.typesRepo.create({ ...dto, tenantId });
    return this.typesRepo.save(type);
  }

  async getTypes(tenantId: string) {
    return this.typesRepo.find({
      where: { tenantId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getTypeWithBrands(tenantId: string, id: string) {
    const type = await this.typesRepo.findOne({
      where: { id, tenantId },
      relations: ['brands'],
    });
    if (!type) throw new NotFoundException('Device type not found');
    return type;
  }

  async updateType(tenantId: string, id: string, dto: UpdateDeviceTypeDto) {
    const type = await this.typesRepo.findOne({ where: { id, tenantId } });
    if (!type) throw new NotFoundException('Device type not found');
    Object.assign(type, dto);
    return this.typesRepo.save(type);
  }

  async deleteType(tenantId: string, id: string) {
    const type = await this.typesRepo.findOne({ where: { id, tenantId } });
    if (!type) throw new NotFoundException('Device type not found');
    type.isActive = false;
    return this.typesRepo.save(type);
  }

  // ---- DEVICE BRANDS ----

  async createBrand(tenantId: string, dto: CreateDeviceBrandDto) {
    const brand = this.brandsRepo.create({ ...dto, tenantId });
    return this.brandsRepo.save(brand);
  }

  async getBrands(tenantId: string, deviceTypeId?: string) {
    const where: any = { tenantId, isActive: true };
    if (deviceTypeId) where.deviceTypeId = deviceTypeId;
    return this.brandsRepo.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async updateBrand(tenantId: string, id: string, dto: UpdateDeviceBrandDto) {
    const brand = await this.brandsRepo.findOne({ where: { id, tenantId } });
    if (!brand) throw new NotFoundException('Device brand not found');
    Object.assign(brand, dto);
    return this.brandsRepo.save(brand);
  }

  async deleteBrand(tenantId: string, id: string) {
    const brand = await this.brandsRepo.findOne({ where: { id, tenantId } });
    if (!brand) throw new NotFoundException('Device brand not found');
    brand.isActive = false;
    return this.brandsRepo.save(brand);
  }

  // ---- SEED DEFAULTS ----

  async seedDefaults(tenantId: string) {
    const existing = await this.typesRepo.count({ where: { tenantId } });
    if (existing > 0) return;

    const defaults = [
      { name: 'Celular', icon: 'phone_android', brands: ['Samsung', 'Apple', 'Xiaomi', 'Huawei', 'Motorola', 'OPPO', 'Realme'] },
      { name: 'Computador Portatil', icon: 'laptop', brands: ['HP', 'Dell', 'Lenovo', 'Acer', 'ASUS', 'Apple', 'MSI'] },
      { name: 'Computador Escritorio', icon: 'desktop_windows', brands: ['HP', 'Dell', 'Lenovo', 'Custom'] },
      { name: 'Tablet', icon: 'tablet', brands: ['Apple', 'Samsung', 'Huawei', 'Lenovo'] },
      { name: 'Impresora', icon: 'print', brands: ['HP', 'Epson', 'Canon', 'Brother'] },
      { name: 'Electrodomestico', icon: 'kitchen', brands: ['LG', 'Samsung', 'Whirlpool', 'Mabe', 'Haceb'] },
      { name: 'Consola', icon: 'sports_esports', brands: ['Sony', 'Microsoft', 'Nintendo'] },
    ];

    for (let i = 0; i < defaults.length; i++) {
      const d = defaults[i];
      const type = await this.typesRepo.save(
        this.typesRepo.create({
          tenantId,
          name: d.name,
          icon: d.icon,
          sortOrder: i,
        }),
      );

      for (let j = 0; j < d.brands.length; j++) {
        await this.brandsRepo.save(
          this.brandsRepo.create({
            tenantId,
            deviceTypeId: type.id,
            name: d.brands[j],
            sortOrder: j,
          }),
        );
      }
    }
  }
}
