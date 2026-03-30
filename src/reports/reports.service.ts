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

    // Revenue includes delivered + closed orders
    const completedOrders = await this.ordersRepository.find({
      where: [
        { tenantId, status: OrderStatus.DELIVERED },
        { tenantId, status: OrderStatus.CLOSED },
      ],
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
    const orders = await this.ordersRepository.find({
      where: [
        { tenantId, status: OrderStatus.DELIVERED, deliveredAt: Between(startDate, endDate) },
        { tenantId, status: OrderStatus.CLOSED, deliveredAt: Between(startDate, endDate) },
      ],
      relations: ['customer', 'items'],
      order: { deliveredAt: 'DESC' },
    });

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
        where: [
          { tenantId, technicianId: tech.id, status: OrderStatus.DELIVERED },
          { tenantId, technicianId: tech.id, status: OrderStatus.CLOSED },
        ],
      });

      const activeOrders = await this.ordersRepository.count({
        where: [
          { tenantId, technicianId: tech.id, status: OrderStatus.REPAIRING },
          { tenantId, technicianId: tech.id, status: OrderStatus.DIAGNOSING },
        ],
      });

      const orders = await this.ordersRepository.find({
        where: [
          { tenantId, technicianId: tech.id, status: OrderStatus.DELIVERED },
          { tenantId, technicianId: tech.id, status: OrderStatus.CLOSED },
        ],
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
}
