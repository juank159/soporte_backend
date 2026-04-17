import {
  Controller,
  Get,
  Post,
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
  UpdateEquipmentStatusDto,
  AddDiagnosisDto,
} from './dto/create-order.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentTenant, CurrentUser } from '../common/decorators/tenant.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OrderStatus } from './entities/service-order.entity';
import { SubscriptionService } from '../tenants/subscription.service';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service order' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateOrderDto,
  ) {
    await this.subscriptionService.validateCanCreateOrder(tenantId);
    return this.ordersService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List/search orders (paginated)' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'dateTo', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll(
      tenantId, status, search, dateFrom, dateTo,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
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

  // ===== EQUIPMENT ENDPOINTS =====
  @Patch(':id/equipments/:equipmentId/status')
  @ApiOperation({ summary: 'Update individual equipment status' })
  updateEquipmentStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') orderId: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateEquipmentStatus(
      tenantId, orderId, equipmentId, dto, user?.id, user?.fullName,
    );
  }

  @Patch(':id/equipments/:equipmentId/diagnosis')
  @ApiOperation({ summary: 'Add diagnosis to equipment' })
  addEquipmentDiagnosis(
    @CurrentTenant() tenantId: string,
    @Param('id') orderId: string,
    @Param('equipmentId') equipmentId: string,
    @Body() body: { diagnosis: string; laborCost?: number },
  ) {
    return this.ordersService.addEquipmentDiagnosis(
      tenantId, orderId, equipmentId, body.diagnosis, body.laborCost,
    );
  }

  @Post(':id/equipments/:equipmentId/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Assign technician to equipment' })
  assignEquipmentTechnician(
    @CurrentTenant() tenantId: string,
    @Param('id') orderId: string,
    @Param('equipmentId') equipmentId: string,
    @Body('technicianId') technicianId: string,
  ) {
    return this.ordersService.assignEquipmentTechnician(
      tenantId, orderId, equipmentId, technicianId,
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
