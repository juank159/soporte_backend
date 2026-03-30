import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateDeviceDto,
  ) {
    return this.devicesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all devices' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.devicesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.devicesService.findOne(tenantId, id);
  }
}
