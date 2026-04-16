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

  async getDashboardStats(tenantId: string) {
    const totalOrders = await this.ordersRepository.count({
      where: { tenantId },
    });

    const statusCounts: Record<string, number> = {};
    for (const status of Object.values(OrderStatus)) {
      statusCounts[status] = await this.ordersRepository.count({
        where: { tenantId, status },
      });
    }

    // Revenue: sum total from ALL orders that have total > 0 (partial or full delivery)
    const ordersWithRevenue = await this.ordersRepository
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.total > 0')
      .getMany();

    const totalRevenue = ordersWithRevenue.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );

    const completedOrders = await this.ordersRepository.count({
      where: { tenantId, status: OrderStatus.DELIVERED },
    });

    return {
      totalOrders,
      statusCounts,
      totalRevenue,
      completedCount: completedOrders,
    };
  }

  async getRevenueReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Use timezone-safe range: from startDate 00:00 local to endDate 23:59 local
    // For Americas (UTC-3 to UTC-8), add buffer hours
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    end.setHours(12, 0, 0, 0); // noon next day covers any timezone offset

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

    // Parse payment methods from order HISTORY (delivery notes always have payment method)
    const paymentBreakdown: Record<string, number> = {};

    for (const order of orders) {
      // Get delivery history entries for this order
      const deliveryHistory = await this.historyRepository.find({
        where: { orderId: order.id, toStatus: 'delivered' },
        order: { createdAt: 'DESC' },
      });

      if (deliveryHistory.length > 0) {
        // Parse payment method and amount from each delivery note
        for (const h of deliveryHistory) {
          const method = this.extractPaymentMethod(h.notes);
          const amountMatch = h.notes?.match(/Entregado por \$([0-9.,]+)/);
          let amount = 0;
          if (amountMatch) {
            amount = Number(amountMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
          }
          if (amount > 0) {
            paymentBreakdown[method] = (paymentBreakdown[method] || 0) + amount;
          }
        }
      } else {
        // No delivery history - count as unspecified
        paymentBreakdown['Sin especificar'] = (paymentBreakdown['Sin especificar'] || 0) + Number(order.total);
      }
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

  async getTechnicianReport(tenantId: string) {
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
      const completedOrders = await this.ordersRepository.count({
        where: { tenantId, technicianId: tech.id, status: OrderStatus.DELIVERED },
      });

      const activeOrders = await this.ordersRepository.count({
        where: [
          { tenantId, technicianId: tech.id, status: OrderStatus.REPAIRING },
          { tenantId, technicianId: tech.id, status: OrderStatus.DIAGNOSING },
        ],
      });

      // Revenue: any order with total > 0 assigned to this tech
      const revenueOrders = await this.ordersRepository
        .createQueryBuilder('o')
        .where('o.tenantId = :tenantId', { tenantId })
        .andWhere('o.technicianId = :techId', { techId: tech.id })
        .andWhere('o.total > 0')
        .getMany();

      const totalRevenue = revenueOrders.reduce(
        (sum, o) => sum + Number(o.total),
        0,
      );

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

  async getRepairTimeReport(tenantId: string) {
    const orders = await this.ordersRepository.find({
      where: { tenantId, status: OrderStatus.DELIVERED },
    });

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
