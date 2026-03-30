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
import { PrintersService } from './printers.service';
import { Printer } from './entities/printer.entity';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Printers')
@Controller('printers')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a printer' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: Partial<Printer>,
  ) {
    return this.printersService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List printers' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.printersService.findAll(tenantId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update printer' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<Printer>,
  ) {
    return this.printersService.update(tenantId, id, dto);
  }
}
