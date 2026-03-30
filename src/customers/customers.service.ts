import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    const customer = this.customersRepository.create({ ...dto, tenantId });
    return this.customersRepository.save(customer);
  }

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      return this.customersRepository.find({
        where: [
          { tenantId, fullName: ILike(`%${search}%`) },
          { tenantId, idNumber: ILike(`%${search}%`) },
          { tenantId, phone: ILike(`%${search}%`) },
        ],
        order: { fullName: 'ASC' },
      });
    }
    return this.customersRepository.find({ where, order: { fullName: 'ASC' } });
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.customersRepository.findOne({
      where: { id, tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(tenantId, id);
    Object.assign(customer, dto);
    return this.customersRepository.save(customer);
  }
}
