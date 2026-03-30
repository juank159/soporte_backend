import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DeviceCatalogService } from './device-catalog.service';
import {
  CreateDeviceTypeDto,
  UpdateDeviceTypeDto,
  CreateDeviceBrandDto,
  UpdateDeviceBrandDto,
} from './dto/device-catalog.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Device Catalog')
@Controller('device-catalog')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class DeviceCatalogController {
  constructor(private readonly service: DeviceCatalogService) {}

  // ---- TYPES ----

  @Get('types')
  @ApiOperation({ summary: 'List device types for this tenant' })
  getTypes(@CurrentTenant() tenantId: string) {
    return this.service.getTypes(tenantId);
  }

  @Get('types/:id')
  @ApiOperation({ summary: 'Get device type with its brands' })
  getType(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.getTypeWithBrands(tenantId, id);
  }

  @Post('types')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create device type' })
  createType(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateDeviceTypeDto,
  ) {
    return this.service.createType(tenantId, dto);
  }

  @Put('types/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update device type' })
  updateType(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDeviceTypeDto,
  ) {
    return this.service.updateType(tenantId, id, dto);
  }

  @Delete('types/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate device type' })
  deleteType(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.deleteType(tenantId, id);
  }

  // ---- BRANDS ----

  @Get('brands')
  @ApiOperation({ summary: 'List device brands, optionally filtered by type' })
  @ApiQuery({ name: 'deviceTypeId', required: false })
  getBrands(
    @CurrentTenant() tenantId: string,
    @Query('deviceTypeId') deviceTypeId?: string,
  ) {
    return this.service.getBrands(tenantId, deviceTypeId);
  }

  @Post('brands')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create device brand' })
  createBrand(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateDeviceBrandDto,
  ) {
    return this.service.createBrand(tenantId, dto);
  }

  @Put('brands/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update device brand' })
  updateBrand(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDeviceBrandDto,
  ) {
    return this.service.updateBrand(tenantId, id, dto);
  }

  @Delete('brands/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate device brand' })
  deleteBrand(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.deleteBrand(tenantId, id);
  }

  // ---- SEED ----

  @Post('seed')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Seed default device types and brands for tenant' })
  seed(@CurrentTenant() tenantId: string) {
    return this.service.seedDefaults(tenantId);
  }
}
