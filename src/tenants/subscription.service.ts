import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Subscription, SubscriptionPlan } from './entities/subscription.entity';
import { DeviceSession } from './entities/device-session.entity';
import { User } from '../users/entities/user.entity';

const PLAN_LIMITS = {
  [SubscriptionPlan.BASIC]: { maxDevices: 3, maxUsers: 5 },
  [SubscriptionPlan.PRO]: { maxDevices: 5, maxUsers: 20 },
  [SubscriptionPlan.ENTERPRISE]: { maxDevices: 50, maxUsers: 100 },
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subRepo: Repository<Subscription>,
    @InjectRepository(DeviceSession)
    private sessionRepo: Repository<DeviceSession>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async createDefault(tenantId: string) {
    const existing = await this.subRepo.findOne({ where: { tenantId } });
    if (existing) return existing;

    const sub = this.subRepo.create({
      tenantId,
      plan: SubscriptionPlan.BASIC,
      ...PLAN_LIMITS[SubscriptionPlan.BASIC],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    });
    return this.subRepo.save(sub);
  }

  async getSubscription(tenantId: string) {
    const sub = await this.subRepo.findOne({ where: { tenantId } });
    if (!sub) return this.createDefault(tenantId);

    // Count active devices (active in last 24h)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeDevices = await this.sessionRepo.count({
      where: { tenantId, isActive: true, lastActive: MoreThan(cutoff) },
    });
    sub.activeDevices = activeDevices;

    // Get device list
    const devices = await this.sessionRepo.find({
      where: { tenantId, isActive: true },
      order: { lastActive: 'DESC' },
    });

    // Count active users
    const activeUsers = await this.usersRepo.count({
      where: { tenantId, isActive: true },
    });

    const isExpired = sub.expiresAt ? new Date(sub.expiresAt) < new Date() : false;
    const daysRemaining = sub.expiresAt
      ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;

    // Calculate total days of the plan period (from creation to expiry)
    const totalDays = sub.createdAt && sub.expiresAt
      ? Math.ceil((new Date(sub.expiresAt).getTime() - new Date(sub.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      : 30;
    const daysUsed = totalDays - (daysRemaining ?? 0);

    return {
      id: sub.id,
      tenantId: sub.tenantId,
      plan: sub.plan,
      maxDevices: sub.maxDevices,
      maxUsers: sub.maxUsers,
      activeDevices,
      activeUsers,
      expiresAt: sub.expiresAt,
      createdAt: sub.createdAt,
      isActive: sub.isActive,
      isExpired,
      daysRemaining,
      daysUsed: Math.max(daysUsed, 0),
      totalDays: Math.max(totalDays, 1),
      devices: devices.map((d) => ({
        id: d.id,
        deviceName: d.deviceName,
        platform: d.platform,
        lastActive: d.lastActive,
        userId: d.userId,
      })),
    };
  }

  async registerDevice(
    tenantId: string,
    userId: string,
    deviceId: string,
    deviceName: string,
    platform: string,
  ) {
    const sub = await this.getSubscription(tenantId) as any;

    // Check if subscription is expired
    if (sub.isExpired) {
      throw new ForbiddenException('Suscripcion expirada. Contacte al administrador.');
    }

    // Check if this device is already registered
    let session = await this.sessionRepo.findOne({
      where: { tenantId, deviceId },
    });

    if (session) {
      session.lastActive = new Date();
      session.isActive = true;
      session.userId = userId;
      return this.sessionRepo.save(session);
    }

    // Check device limit
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeCount = await this.sessionRepo.count({
      where: { tenantId, isActive: true, lastActive: MoreThan(cutoff) },
    });

    if (activeCount >= sub.maxDevices) {
      throw new ForbiddenException(
        `Limite de dispositivos alcanzado (${sub.maxDevices}). Actualice su plan.`,
      );
    }

    session = this.sessionRepo.create({
      tenantId,
      userId,
      deviceId,
      deviceName,
      platform,
      lastActive: new Date(),
    });
    return this.sessionRepo.save(session);
  }

  async validateCanCreateOrder(tenantId: string) {
    let sub = await this.subRepo.findOne({ where: { tenantId } });
    if (!sub) sub = await this.createDefault(tenantId);

    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      throw new ForbiddenException(
        'Su suscripcion ha expirado. No puede crear ordenes. Contacte al administrador para renovar.',
      );
    }
  }

  async deactivateDevice(tenantId: string, sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, tenantId },
    });
    if (!session) return;
    session.isActive = false;
    return this.sessionRepo.save(session);
  }

  async updatePlan(tenantId: string, plan: SubscriptionPlan, months: number) {
    let sub = await this.subRepo.findOne({ where: { tenantId } });
    if (!sub) sub = await this.createDefault(tenantId);

    sub.plan = plan;
    sub.maxDevices = PLAN_LIMITS[plan].maxDevices;
    sub.maxUsers = PLAN_LIMITS[plan].maxUsers;
    sub.expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
    sub.isActive = true;

    return this.subRepo.save(sub);
  }
}
