import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ServiceOrder, OrderStatus } from '../orders/entities/service-order.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ServiceOrder)
    private ordersRepository: Repository<ServiceOrder>,
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

    // Revenue from delivered orders
    const completedOrders = await this.ordersRepository.find({
      where: { tenantId, status: OrderStatus.DELIVERED },
    });

    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );

    return {
      totalOrders,
      statusCounts,
      totalRevenue,
      completedCount: completedOrders.length,
    };
  }

  async getRevenueReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Ensure endDate includes the full day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Use query builder for more flexible date filtering
    // Some orders might have deliveredAt null, fallback to createdAt
    const orders = await this.ordersRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'c')
      .leftJoinAndSelect('o.items', 'i')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status = :status', {
        status: OrderStatus.DELIVERED,
      })
      .andWhere(
        'COALESCE(o.deliveredAt, o.createdAt) BETWEEN :start AND :end',
        { start, end },
      )
      .orderBy('COALESCE(o.deliveredAt, o.createdAt)', 'DESC')
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
      (sum, o) => sum + Number(o.laborCost),
      0,
    );

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      ordersCount: orders.length,
      totalRevenue,
      totalTax,
      totalLabor,
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

      const orders = await this.ordersRepository.find({
        where: { tenantId, technicianId: tech.id, status: OrderStatus.DELIVERED },
      });

      const totalRevenue = orders.reduce(
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
}
