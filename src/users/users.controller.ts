import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(tenantId, createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users of the tenant' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.usersService.findOne(tenantId, id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(tenantId, id, updateUserDto);
  }
}
