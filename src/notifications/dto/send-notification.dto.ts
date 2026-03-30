import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationChannel {
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
}

export enum NotificationTemplate {
  ORDER_RECEIVED = 'order_received',
  DIAGNOSIS_READY = 'diagnosis_ready',
  REPAIR_COMPLETE = 'repair_complete',
  READY_FOR_PICKUP = 'ready_for_pickup',
}

export class SendNotificationDto {
  @ApiProperty({ description: 'Order ID' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ enum: NotificationTemplate })
  @IsEnum(NotificationTemplate)
  templateType: NotificationTemplate;
}
