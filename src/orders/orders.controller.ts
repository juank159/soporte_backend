import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  AddDiagnosisDto,
} from './dto/create-order.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentTenant, CurrentUser } from '../common/decorators/tenant.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OrderStatus } from './entities/service-order.entity';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service order' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List/search orders' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'dateTo', required: false, example: '2026-12-31' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.ordersService.findAll(tenantId, status, search, dateFrom, dateTo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.ordersService.findOne(tenantId, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get order status history' })
  getHistory(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.ordersService.getHistory(tenantId, id);
  }

  @Patch(':id/delivery-info')
  @ApiOperation({ summary: 'Update total and warranty for delivery' })
  async updateDeliveryInfo(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { total: number; warrantyDays: number },
  ) {
    return this.ordersService.updateDeliveryInfo(tenantId, id, body.total, body.warrantyDays);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(
      tenantId, id, dto, user?.id, user?.fullName,
    );
  }

  @Post(':id/diagnosis')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add diagnosis to order' })
  addDiagnosis(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AddDiagnosisDto,
  ) {
    return this.ordersService.addDiagnosis(tenantId, id, dto);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Assign technician to order' })
  assignTechnician(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('technicianId') technicianId: string,
  ) {
    return this.ordersService.assignTechnician(tenantId, id, technicianId);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Add photo to order (device photo at any stage)' })
  addPhoto(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { photoUrl: string; description?: string; stage?: string },
  ) {
    return this.ordersService.addPhoto(tenantId, id, body.photoUrl, body.description, body.stage);
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'Get all photos of an order' })
  getPhotos(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.ordersService.getPhotos(tenantId, id);
  }
}
