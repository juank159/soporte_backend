import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ServiceOrder, OrderStatus } from '../orders/entities/service-order.entity';
import { OrderHistory } from '../orders/entities/order-history.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ServiceOrder)
    private ordersRepository: Repository<ServiceOrder>,
    @InjectRepository(OrderHistory)
    private historyRepository: Repository<OrderHistory>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private getDateRange(startDate?: string, endDate?: string) {
    if (!startDate || !endDate) return null;
    // Colombia is UTC-5: midnight local = 05:00 UTC
    const start = new Date(startDate + 'T05:00:00.000Z');
    const end = new Date(endDate + 'T05:00:00.000Z');
    end.setDate(end.getDate() + 1); // end of day = next day 05:00 UTC
    return { start, end };
  }

  async getDashboardStats(tenantId: string, startDate?: string, endDate?: string) {
    const range = this.getDateRange(startDate, endDate);

    const qb = this.ordersRepository.createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId });
    if (range) {
      qb.andWhere('COALESCE(o.deliveredAt, o.updatedAt) BETWEEN :start AND :end', range);
    }
    const orders = await qb.getMany();

    const totalOrders = orders.length;
    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    }

    const totalRevenue = orders
      .filter(o => Number(o.total) > 0)
      .reduce((sum, o) => sum + Number(o.total), 0);

    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;

    return {
      totalOrders,
      statusCounts,
      totalRevenue,
      completedCount: completedOrders,
    };
  }

  async getRevenueReport(
    tenantId: string,
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate)!;

    // Use query builder for more flexible date filtering
    // Some orders might have deliveredAt null, fallback to createdAt
    // Include any order with total > 0 (partial or full delivery)
    const orders = await this.ordersRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'c')
      .leftJoinAndSelect('o.items', 'i')
      .leftJoinAndSelect('o.equipments', 'eq')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.total > 0')
      .andWhere(
        'COALESCE(o.deliveredAt, o.updatedAt) BETWEEN :start AND :end',
        { start, end },
      )
      .orderBy('COALESCE(o.deliveredAt, o.updatedAt)', 'DESC')
      .getMany();

    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );
    const totalTax = orders.reduce(
      (sum, o) => sum + Number(o.tax),
      0,
    );
    const totalLabor = orders.reduce(
      (sum, o) => sum + Number(o.laborCost || 0),
      0,
    );

    // Payment breakdown: use the LAST delivery history note per order to get payment method
    // Then assign order.total to that method (same source as totalRevenue)
    const paymentBreakdown: Record<string, number> = {};

    for (const order of orders) {
      const lastDelivery = await this.historyRepository.findOne({
        where: { orderId: order.id, toStatus: 'delivered' },
        order: { createdAt: 'DESC' },
      });

      const method = lastDelivery ? this.extractPaymentMethod(lastDelivery.notes) : 'Sin especificar';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(order.total);
    }

    return {
      period: { start: startDate, end: endDate },
      ordersCount: orders.length,
      totalRevenue,
      totalTax,
      totalLabor,
      paymentBreakdown,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer?.fullName,
        total: o.total,
        deliveredAt: o.deliveredAt,
      })),
    };
  }

  async getTechnicianReport(tenantId: string, startDate?: string, endDate?: string) {
    const range = this.getDateRange(startDate, endDate);
    const technicians = await this.usersRepository.find({
      where: { tenantId, role: 'technician' as any, isActive: true },
    });

    const result: Array<{
      technicianId: string;
      name: string;
      completedOrders: number;
      activeOrders: number;
      totalRevenue: number;
    }> = [];

    for (const tech of technicians) {
      const qb = this.ordersRepository.createQueryBuilder('o')
        .where('o.tenantId = :tenantId', { tenantId })
        .andWhere('o.technicianId = :techId', { techId: tech.id });
      if (range) {
        qb.andWhere('COALESCE(o.deliveredAt, o.updatedAt) BETWEEN :start AND :end', range);
      }
      const techOrders = await qb.getMany();

      const completedOrders = techOrders.filter(o => o.status === OrderStatus.DELIVERED).length;
      const activeOrders = techOrders.filter(o =>
        o.status === OrderStatus.REPAIRING || o.status === OrderStatus.DIAGNOSING).length;
      const totalRevenue = techOrders
        .filter(o => Number(o.total) > 0)
        .reduce((sum, o) => sum + Number(o.total), 0);

      result.push({
        technicianId: tech.id,
        name: tech.fullName,
        completedOrders,
        activeOrders,
        totalRevenue,
      });
    }

    // Sort by completed orders descending
    result.sort((a, b) => b.completedOrders - a.completedOrders);

    return result;
  }

  async getRepairTimeReport(tenantId: string, startDate?: string, endDate?: string) {
    const range = this.getDateRange(startDate, endDate);
    const qb = this.ordersRepository.createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED });
    if (range) {
      qb.andWhere('COALESCE(o.deliveredAt, o.updatedAt) BETWEEN :start AND :end', range);
    }
    const orders = await qb.getMany();

    if (orders.length === 0) {
      return { averageHours: 0, fastestHours: 0, slowestHours: 0, count: 0 };
    }

    const times = orders
      .filter((o) => o.deliveredAt)
      .map((o) => {
        const created = new Date(o.createdAt).getTime();
        const delivered = new Date(o.deliveredAt!).getTime();
        return (delivered - created) / (1000 * 60 * 60); // hours
      });

    if (times.length === 0) {
      return { averageHours: 0, fastestHours: 0, slowestHours: 0, count: 0 };
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    return {
      averageHours: Math.round(avg * 10) / 10,
      fastestHours: Math.round(Math.min(...times) * 10) / 10,
      slowestHours: Math.round(Math.max(...times) * 10) / 10,
      count: times.length,
    };
  }

  async getStaleOrders(tenantId: string) {
    // Orders that have been in the system without being delivered
    const activeStatuses = [
      OrderStatus.RECEIVED,
      OrderStatus.DIAGNOSING,
      OrderStatus.REPAIRING,
      OrderStatus.READY,
    ];

    const orders = await this.ordersRepository.find({
      where: activeStatuses.map((status) => ({ tenantId, status })),
      relations: ['customer', 'device'],
      order: { createdAt: 'ASC' },
    });

    const now = Date.now();
    const result = orders.map((o) => {
      const daysInSystem = Math.floor(
        (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.customer?.fullName,
        device: o.device
          ? `${o.device.brand} ${o.device.model}`
          : null,
        createdAt: o.createdAt,
        daysInSystem,
        priority: daysInSystem >= 30
          ? 'critical'
          : daysInSystem >= 15
            ? 'warning'
            : 'normal',
      };
    });

    // Sort by days in system (oldest first)
    result.sort((a, b) => b.daysInSystem - a.daysInSystem);

    return {
      total: result.length,
      critical: result.filter((o) => o.priority === 'critical').length,
      warning: result.filter((o) => o.priority === 'warning').length,
      orders: result,
    };
  }

  private extractPaymentMethod(notes: string | null): string {
    if (!notes) return 'Sin especificar';
    if (notes.includes('Efectivo')) return 'Efectivo';
    if (notes.includes('Transferencia')) return 'Transferencia';
    if (notes.includes('Tarjeta de Credito')) return 'Tarjeta de Credito';
    if (notes.includes('Tarjeta de Debito')) return 'Tarjeta de Debito';
    return 'Sin especificar';
  }
}
