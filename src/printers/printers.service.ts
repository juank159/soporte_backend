import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';

@Injectable()
export class PrintersService {
  constructor(
    @InjectRepository(Printer)
    private printersRepository: Repository<Printer>,
  ) {}

  async create(tenantId: string, dto: Partial<Printer>) {
    const printer = this.printersRepository.create({ ...dto, tenantId });
    return this.printersRepository.save(printer);
  }

  async findAll(tenantId: string) {
    return this.printersRepository.find({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string) {
    const printer = await this.printersRepository.findOne({
      where: { id, tenantId },
    });
    if (!printer) throw new NotFoundException('Printer not found');
    return printer;
  }

  async update(tenantId: string, id: string, dto: Partial<Printer>) {
    const printer = await this.findOne(tenantId, id);
    Object.assign(printer, dto);
    return this.printersRepository.save(printer);
  }
}
