import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder } from '../orders/entities/service-order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

export interface NotificationPayload {
  orderId: string;
  channel: 'sms' | 'whatsapp' | 'email';
  templateType:
    | 'order_received'
    | 'diagnosis_ready'
    | 'repair_complete'
    | 'ready_for_pickup';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(ServiceOrder)
    private ordersRepository: Repository<ServiceOrder>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async sendNotification(tenantId: string, payload: NotificationPayload) {
    const order = await this.ordersRepository.findOne({
      where: { id: payload.orderId, tenantId },
      relations: ['customer', 'device'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    const message = this.buildMessage(payload.templateType, order, tenant!);

    // Log the notification (in production, integrate with SMS/WhatsApp/Email API)
    this.logger.log(
      `[${payload.channel.toUpperCase()}] To: ${order.customer?.phone} | ${message}`,
    );

    // TODO: Integrate with actual providers:
    // SMS: Twilio, AWS SNS
    // WhatsApp: Twilio WhatsApp API, Meta Cloud API
    // Email: SendGrid, AWS SES, Nodemailer

    return {
      success: true,
      channel: payload.channel,
      recipient: payload.channel === 'email'
        ? order.customer?.email
        : order.customer?.phone,
      message,
      sentAt: new Date(),
    };
  }

  private buildMessage(
    templateType: string,
    order: ServiceOrder,
    tenant: Tenant,
  ): string {
    const customerName = order.customer?.fullName || 'Cliente';
    const orderNum = order.orderNumber;
    const tenantName = tenant.name;
    const device = `${order.device?.brand || ''} ${order.device?.model || ''}`.trim();

    switch (templateType) {
      case 'order_received':
        return (
          `Hola ${customerName}, tu equipo ${device} ha sido recibido en ${tenantName}. ` +
          `Numero de orden: ${orderNum}. Te notificaremos cuando tengamos el diagnostico.`
        );

      case 'diagnosis_ready':
        return (
          `Hola ${customerName}, el diagnostico de tu equipo ${device} esta listo. ` +
          `Orden: ${orderNum}. Contactanos para aprobar la reparacion.`
        );

      case 'repair_complete':
        return (
          `Hola ${customerName}, la reparacion de tu ${device} ha sido completada. ` +
          `Orden: ${orderNum}. Estamos realizando el control de calidad.`
        );

      case 'ready_for_pickup':
        return (
          `Hola ${customerName}, tu ${device} esta listo para recoger! ` +
          `Orden: ${orderNum}. Te esperamos en ${tenantName}.`
        );

      default:
        return `Notificacion de ${tenantName} sobre tu orden ${orderNum}.`;
    }
  }
}
