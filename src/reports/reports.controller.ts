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
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getDashboard(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDashboardStats(tenantId, startDate, endDate);
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
    return this.reportsService.getRevenueReport(tenantId, startDate, endDate);
  }

  @Get('technicians')
  @ApiOperation({ summary: 'Technician performance report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTechnicians(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getTechnicianReport(tenantId, startDate, endDate);
  }

  @Get('repair-time')
  @ApiOperation({ summary: 'Average repair time report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getRepairTime(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRepairTimeReport(tenantId, startDate, endDate);
  }

  @Get('stale-orders')
  @ApiOperation({ summary: 'Orders pending for too long (15+ days)' })
  getStaleOrders(@CurrentTenant() tenantId: string) {
    return this.reportsService.getStaleOrders(tenantId);
  }
}
