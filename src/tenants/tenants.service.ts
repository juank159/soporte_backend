import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant } from './entities/tenant.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { DeviceCatalogService } from '../device-catalog/device-catalog.service';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private deviceCatalogService: DeviceCatalogService,
    private subscriptionService: SubscriptionService,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    const existing = await this.tenantsRepository.findOne({
      where: { slug: createTenantDto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }

    const tenant = this.tenantsRepository.create({
      name: createTenantDto.name,
      slug: createTenantDto.slug,
      nit: createTenantDto.nit,
      address: createTenantDto.address,
      phone: createTenantDto.phone,
      email: createTenantDto.email,
      timezone: createTenantDto.timezone || 'America/Bogota',
    });

    const savedTenant = await this.tenantsRepository.save(tenant);

    // Create admin user for the tenant
    const passwordHash = await bcrypt.hash(createTenantDto.adminPassword, 12);
    const adminUser = this.usersRepository.create({
      tenantId: savedTenant.id,
      email: createTenantDto.adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      fullName: createTenantDto.adminName,
    });

    await this.usersRepository.save(adminUser);

    // Seed defaults
    await this.deviceCatalogService.seedDefaults(savedTenant.id);
    await this.subscriptionService.createDefault(savedTenant.id);

    // Create Express customer
    await this.customersRepository.save(
      this.customersRepository.create({
        tenantId: savedTenant.id,
        fullName: 'Cliente Express',
        idNumber: 'EXPRESS',
        phone: '0000000000',
      }),
    );

    return {
      tenant: savedTenant,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.fullName,
        role: adminUser.role,
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return this.tenantsRepository.save(tenant);
  }

  async findAll() {
    return this.tenantsRepository.find({ where: { isActive: true } });
  }
}
