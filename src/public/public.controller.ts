import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { ServiceOrder } from '../orders/entities/service-order.entity';
import { OrderHistory } from '../orders/entities/order-history.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Public')
@Controller()
export class PublicController {
  constructor(
    @InjectRepository(ServiceOrder)
    private ordersRepository: Repository<ServiceOrder>,
    @InjectRepository(OrderHistory)
    private historyRepository: Repository<OrderHistory>,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  @Get('public/status/:orderId')
  @ApiOperation({ summary: 'Public: Get order status (no auth required)' })
  async getOrderStatus(@Param('orderId') orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['device'],
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: order.tenantId },
    });

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: this.getStatusLabel(order.status),
      device: order.device
        ? {
            type: order.device.type,
            brand: order.device.brand,
            model: order.device.model,
          }
        : null,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      tenant: tenant
        ? {
            name: tenant.name,
            phone: tenant.phone,
            address: tenant.address,
          }
        : null,
      timeline: this.getTimeline(order),
      history: await this.getOrderHistory(orderId),
    };
  }

  @Get('status/:orderId')
  @ApiOperation({ summary: 'Public: Order status HTML page' })
  async getStatusPage(
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    try {
      const order = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['device'],
      });

      if (!order) {
        res.status(404).send(this.renderErrorPage('Orden no encontrada'));
        return;
      }

      const tenant = await this.tenantsRepository.findOne({
        where: { id: order.tenantId },
      });

      let techName = '';
      if (order.technicianId) {
        const tech = await this.usersRepository.findOne({ where: { id: order.technicianId } });
        if (tech) techName = tech.fullName;
      }

      const history = await this.getOrderHistory(order.id);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(this.renderStatusPage(order, tenant, history, techName));
    } catch {
      res.status(500).send(this.renderErrorPage('Error del servidor'));
    }
  }

  private async getOrderHistory(orderId: string) {
    const history = await this.historyRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
    return history.map((h) => ({
      status: this.getStatusLabel(h.toStatus),
      notes: h.notes,
      date: h.createdAt,
    }));
  }

  private getStatusLabel(status: string): string {
    const labels = {
      received: 'Recibido',
      diagnosing: 'En Diagnostico',
      repairing: 'En Reparacion',
      quality_check: 'Control de Calidad',
      ready: 'Listo para Entrega',
      delivered: 'Entregado',
      closed: 'Cerrado',
    };
    return labels[status] || status;
  }

  private getTimeline(order: ServiceOrder) {
    const stages = [
      { key: 'received', label: 'Recibido', icon: '📥' },
      { key: 'diagnosing', label: 'Diagnostico', icon: '🔍' },
      { key: 'repairing', label: 'Reparacion', icon: '🔧' },
      { key: 'quality_check', label: 'Control Calidad', icon: '✅' },
      { key: 'ready', label: 'Listo', icon: '📦' },
      { key: 'delivered', label: 'Entregado', icon: '🚀' },
    ];

    const currentIndex = stages.findIndex((s) => s.key === order.status);
    return stages.map((s, i) => ({
      ...s,
      completed: i <= currentIndex,
      current: i === currentIndex,
    }));
  }

  private formatDate(date: Date | string, timezone: string, includeTime = true): string {
    const tz = timezone || 'America/Bogota';
    const opts: Intl.DateTimeFormatOptions = includeTime
      ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz }
      : { year: 'numeric', month: 'long', day: 'numeric', timeZone: tz };
    try {
      return new Date(date).toLocaleDateString('es-CO', opts);
    } catch {
      return new Date(date).toLocaleDateString('es-CO');
    }
  }

  private formatDateShort(date: Date | string, timezone: string): string {
    const tz = timezone || 'America/Bogota';
    try {
      return new Date(date).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz,
      });
    } catch {
      return new Date(date).toLocaleDateString('es-CO');
    }
  }

  private renderStatusPage(order: ServiceOrder, tenant: Tenant | null, history: Array<{status: string; notes: string; date: Date}>, technicianName?: string): string {
    const statusLabel = this.getStatusLabel(order.status);
    const timeline = this.getTimeline(order);
    const device = order.device;
    const tenantName = tenant?.name || 'Servicio Tecnico';
    const tenantPhone = tenant?.phone || '';
    const tenantAddress = tenant?.address || '';
    const tz = tenant?.timezone || 'America/Bogota';
    const createdDate = this.formatDate(order.createdAt, tz);

    const timelineHtml = timeline
      .map(
        (s) => `
        <div class="step ${s.completed ? 'completed' : ''} ${s.current ? 'current' : ''}">
          <div class="step-icon">${s.icon}</div>
          <div class="step-label">${s.label}</div>
        </div>`,
      )
      .join('<div class="step-line"></div>');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estado de Orden ${order.orderNumber} - ${tenantName}</title>
  <meta http-equiv="refresh" content="30">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0A1628 0%, #0F2847 100%);
      min-height: 100vh;
      color: #F1F5F9;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
    }
    .card {
      background: rgba(22, 34, 64, 0.9);
      border: 1px solid rgba(30, 58, 95, 0.5);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 18px;
      color: #00D4FF;
      margin-bottom: 4px;
    }
    .header .order-number {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 1px;
      margin: 8px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 24px;
      font-weight: 700;
      font-size: 14px;
      background: rgba(0, 212, 255, 0.15);
      color: #00D4FF;
      border: 1px solid rgba(0, 212, 255, 0.3);
    }
    .status-badge.ready {
      background: rgba(16, 185, 129, 0.15);
      color: #10B981;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .status-badge.delivered {
      background: rgba(16, 185, 129, 0.15);
      color: #10B981;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      overflow-x: auto;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
      opacity: 0.3;
    }
    .step.completed { opacity: 1; }
    .step.current { opacity: 1; }
    .step-icon {
      font-size: 20px;
      margin-bottom: 4px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 2px solid rgba(148, 163, 184, 0.3);
    }
    .step.completed .step-icon {
      border-color: #00D4FF;
      background: rgba(0, 212, 255, 0.1);
    }
    .step.current .step-icon {
      border-color: #00D4FF;
      background: rgba(0, 212, 255, 0.2);
      box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
    }
    .step-label { font-size: 9px; color: #94A3B8; text-align: center; }
    .step.completed .step-label { color: #F1F5F9; }
    .step-line {
      flex: 1;
      height: 2px;
      background: rgba(148, 163, 184, 0.2);
      margin: 0 4px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
    }
    .info-row .label { color: #94A3B8; }
    .info-row .value { font-weight: 500; }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #00D4FF;
      margin: 12px 0 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      margin-top: 8px;
    }
    .auto-refresh {
      text-align: center;
      font-size: 10px;
      color: #64748B;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card header">
      <h1>${tenantName}</h1>
      <div class="order-number">${order.orderNumber}</div>
      <div class="status-badge ${order.status === 'ready' || order.status === 'delivered' ? order.status : ''}">${statusLabel}</div>
    </div>

    <div class="card">
      <div class="timeline">${timelineHtml}</div>
    </div>

    ${device ? `
    <div class="card">
      <div class="section-title">Equipo</div>
      <div class="info-row"><span class="label">Tipo</span><span class="value">${device.type}</span></div>
      <div class="info-row"><span class="label">Marca</span><span class="value">${device.brand}</span></div>
      <div class="info-row"><span class="label">Modelo</span><span class="value">${device.model}</span></div>
      ${device.serial ? `<div class="info-row"><span class="label">Serial</span><span class="value">${device.serial}</span></div>` : ''}
      ${device.accessories && device.accessories.length > 0 ? `<div class="info-row"><span class="label">Accesorios</span><span class="value">${device.accessories.join(', ')}</span></div>` : ''}
      ${technicianName ? `<div class="info-row"><span class="label">Tecnico</span><span class="value">${technicianName}</span></div>` : ''}
    </div>` : ''}

    <div class="card">
      <div class="section-title">Informacion</div>
      <div class="info-row"><span class="label">Recibido</span><span class="value">${createdDate}</span></div>
      ${order.deliveredAt ? `<div class="info-row"><span class="label">Entregado</span><span class="value">${this.formatDate(order.deliveredAt, tz, false)}</span></div>` : ''}
      ${tenantPhone ? `<div class="info-row"><span class="label">Contacto</span><span class="value">${tenantPhone}</span></div>` : ''}
      ${tenantAddress ? `<div class="info-row"><span class="label">Direccion</span><span class="value">${tenantAddress}</span></div>` : ''}
    </div>

    ${history.length > 0 ? `
    <div class="card">
      <div class="section-title">Historial</div>
      ${history.map((h) => `
        <div style="display:flex;align-items:flex-start;margin-bottom:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:#00D4FF;margin:5px 10px 0 0;flex-shrink:0;"></div>
          <div>
            <div style="font-size:13px;font-weight:600;">${h.status}</div>
            ${h.notes ? `<div style="font-size:11px;color:#94A3B8;font-style:italic;margin-top:2px;">${h.notes}</div>` : ''}
            <div style="font-size:10px;color:#64748B;margin-top:1px;">${this.formatDateShort(h.date, tz)}</div>
          </div>
        </div>
      `).join('')}
    </div>` : ''}

    <div class="auto-refresh">Esta pagina se actualiza automaticamente cada 30 segundos</div>
    <div class="footer">Desarrollado por <strong>Baudity</strong> | Contacto: 3138448436</div>
  </div>
</body>
</html>`;
  }

  private renderErrorPage(message: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body { font-family: sans-serif; background: #0A1628; color: #F1F5F9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .error { text-align: center; padding: 40px; }
    h1 { color: #EF4444; font-size: 24px; }
    p { color: #94A3B8; margin-top: 8px; }
  </style>
</head>
<body><div class="error"><h1>${message}</h1><p>Verifique el codigo QR e intente nuevamente.</p></div></body>
</html>`;
  }
}
