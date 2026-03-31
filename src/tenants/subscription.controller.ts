import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionService } from './subscription.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentTenant, CurrentUser } from '../common/decorators/tenant.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Subscription')
@Controller('subscription')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get subscription info with connected devices' })
  getSubscription(@CurrentTenant() tenantId: string) {
    return this.service.getSubscription(tenantId);
  }

  @Post('register-device')
  @ApiOperation({ summary: 'Register device session (called on login)' })
  registerDevice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() body: { deviceId: string; deviceName: string; platform: string },
  ) {
    return this.service.registerDevice(
      tenantId,
      user.id,
      body.deviceId,
      body.deviceName,
      body.platform,
    );
  }

  @Delete('devices/:sessionId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a device session (admin only)' })
  deactivateDevice(
    @CurrentTenant() tenantId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.service.deactivateDevice(tenantId, sessionId);
  }
}
