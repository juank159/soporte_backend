import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Send notification to customer' })
  send(
    @CurrentTenant() tenantId: string,
    @Body() dto: SendNotificationDto,
  ) {
    return this.notificationsService.sendNotification(tenantId, dto);
  }
}
