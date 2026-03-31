import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard(@CurrentTenant() tenantId: string) {
    return this.reportsService.getDashboardStats(tenantId);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue report by date range' })
  @ApiQuery({ name: 'startDate', example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', example: '2026-12-31' })
  getRevenue(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getRevenueReport(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('technicians')
  @ApiOperation({ summary: 'Technician performance report' })
  getTechnicians(@CurrentTenant() tenantId: string) {
    return this.reportsService.getTechnicianReport(tenantId);
  }

  @Get('repair-time')
  @ApiOperation({ summary: 'Average repair time report' })
  getRepairTime(@CurrentTenant() tenantId: string) {
    return this.reportsService.getRepairTimeReport(tenantId);
  }

  @Get('stale-orders')
  @ApiOperation({ summary: 'Orders pending for too long (15+ days)' })
  getStaleOrders(@CurrentTenant() tenantId: string) {
    return this.reportsService.getStaleOrders(tenantId);
  }
}
