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
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new tenant (onboarding)' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant info' })
  findCurrent(@CurrentTenant() tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current tenant' })
  updateCurrent(
    @CurrentTenant() tenantId: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(tenantId, updateTenantDto);
  }
}
