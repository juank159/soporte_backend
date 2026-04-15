import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(tenantId: string, createUserDto: CreateUserDto) {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email, tenantId },
    });
    if (existing) {
      throw new ConflictException('Email already registered in this tenant');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);
    const user = this.usersRepository.create({
      tenantId,
      email: createUserDto.email,
      passwordHash,
      fullName: createUserDto.fullName,
      role: createUserDto.role,
    });

    const saved = await this.usersRepository.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async findAll(tenantId: string) {
    return this.usersRepository.find({
      where: { tenantId },
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt', 'signatureUrl'],
    });
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.usersRepository.findOne({
      where: { id, tenantId },
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt', 'signatureUrl'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateSignature(tenantId: string, id: string, signatureUrl: string) {
    const user = await this.usersRepository.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    user.signatureUrl = signatureUrl;
    await this.usersRepository.save(user);
    return { id: user.id, fullName: user.fullName, signatureUrl: user.signatureUrl };
  }

  async update(tenantId: string, id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, updateUserDto);
    const saved = await this.usersRepository.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }
}
