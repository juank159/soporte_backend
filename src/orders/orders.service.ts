import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ServiceOrder, OrderStatus } from './entities/service-order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPhoto } from './entities/order-photo.entity';
import { OrderHistory } from './entities/order-history.entity';
import { Device } from '../devices/entities/device.entity';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  AddDiagnosisDto,
} from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(ServiceOrder)
    private ordersRepository: Repository<ServiceOrder>,
    @InjectRepository(OrderItem)
    private itemsRepository: Repository<OrderItem>,
    @InjectRepository(OrderPhoto)
    private photosRepository: Repository<OrderPhoto>,
    @InjectRepository(OrderHistory)
    private historyRepository: Repository<OrderHistory>,
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

  async create(tenantId: string, dto: CreateOrderDto) {
    // Create device
    const device = this.devicesRepository.create({
      tenantId,
      type: dto.deviceType,
      brand: dto.deviceBrand,
      model: dto.deviceModel,
      serial: dto.deviceSerial,
      imei: dto.deviceImei,
      color: dto.deviceColor,
      accessories: dto.accessories,
    });
    const savedDevice = await this.devicesRepository.save(device);

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId);

    // Create order
    const order = this.ordersRepository.create({
      tenantId,
      orderNumber,
      customerId: dto.customerId,
      deviceId: savedDevice.id,
      technicianId: dto.technicianId,
      problemReported: dto.problemReported,
      status: OrderStatus.RECEIVED,
    });
    const savedOrder = await this.ordersRepository.save(order);

    // Save photos if provided
    if (dto.photos?.length) {
      const photos = dto.photos.map((photoUrl) =>
        this.photosRepository.create({
          orderId: savedOrder.id,
          photoUrl,
          takenAtStage: 'reception',
        }),
      );
      await this.photosRepository.save(photos);
    }

    // Register creation in history
    await this.addHistory(savedOrder.id, null, OrderStatus.RECEIVED, 'Orden creada');

    return this.findOne(tenantId, savedOrder.id);
  }

  async findAll(
    tenantId: string,
    status?: OrderStatus,
    search?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const qb = this.ordersRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'c')
      .leftJoinAndSelect('o.device', 'd')
      .where('o.tenantId = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }

    if (search && search.length >= 2) {
      qb.andWhere(
        '(o.orderNumber ILIKE :q OR c.fullName ILIKE :q OR c.idNumber ILIKE :q OR c.phone ILIKE :q OR d.brand ILIKE :q OR d.model ILIKE :q)',
        { q: `%${search}%` },
      );
    }

    if (dateFrom) {
      qb.andWhere('o.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('o.createdAt <= :dateTo', { dateTo: to });
    }

    return qb.orderBy('o.createdAt', 'DESC').getMany();
  }

  async findAllSimple(tenantId: string, status?: OrderStatus) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.ordersRepository.find({
      where,
      relations: ['customer', 'device'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id, tenantId },
      relations: ['customer', 'device', 'items', 'signatures'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getHistory(tenantId: string, orderId: string) {
    await this.findOne(tenantId, orderId);
    return this.historyRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  private async addHistory(
    orderId: string,
    fromStatus: string | null,
    toStatus: string,
    notes?: string,
    userId?: string,
    userName?: string,
  ) {
    await this.historyRepository.save(
      this.historyRepository.create({
        orderId,
        fromStatus: fromStatus ?? undefined,
        toStatus,
        notes: notes ?? undefined,
        userId: userId ?? undefined,
        userName: userName ?? undefined,
      }),
    );
  }

  async findByOrderNumber(tenantId: string, orderNumber: string) {
    const order = await this.ordersRepository.findOne({
      where: { orderNumber, tenantId },
      relations: ['customer', 'device', 'items', 'signatures'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateOrderStatusDto,
    userId?: string,
    userName?: string,
  ) {
    const order = await this.ordersRepository.findOne({
      where: { id, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const fromStatus = order.status;
    order.status = dto.status;
    if (dto.notes) order.notes = dto.notes;

    if (dto.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }
    if (dto.status === OrderStatus.CLOSED) {
      order.closedAt = new Date();
    }

    await this.ordersRepository.save(order);

    // Register in history
    await this.addHistory(id, fromStatus, dto.status, dto.notes, userId, userName);

    return this.findOne(tenantId, id);
  }

  async addDiagnosis(tenantId: string, id: string, dto: AddDiagnosisDto) {
    // Verify order belongs to tenant
    const order = await this.ordersRepository.findOne({
      where: { id, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Update diagnosis fields
    order.diagnosis = dto.diagnosis;
    order.status = OrderStatus.DIAGNOSING;

    if (dto.laborCost !== undefined) {
      order.laborCost = dto.laborCost;
    }

    // Save items separately to avoid cascade issues
    if (dto.items?.length) {
      for (const item of dto.items) {
        const orderItem = this.itemsRepository.create({
          orderId: id,
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.qty * item.unitPrice,
        });
        await this.itemsRepository.save(orderItem);
      }
    }

    // Recalculate totals
    const allItems = await this.itemsRepository.find({
      where: { orderId: id },
    });
    const itemsTotal = allItems.reduce((sum, i) => sum + Number(i.total), 0);
    order.subtotal = itemsTotal + Number(order.laborCost);
    order.tax = order.subtotal * 0.19; // IVA Colombia 19%
    order.total = order.subtotal + order.tax;

    await this.ordersRepository.save(order);

    return this.findOne(tenantId, id);
  }

  async addPhoto(tenantId: string, orderId: string, photoUrl: string, description?: string, stage?: string) {
    await this.findOne(tenantId, orderId);
    const photo = this.photosRepository.create({
      orderId,
      photoUrl,
      description,
      takenAtStage: stage || 'reception',
    });
    return this.photosRepository.save(photo);
  }

  async getPhotos(tenantId: string, orderId: string) {
    await this.findOne(tenantId, orderId);
    return this.photosRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateDeliveryInfo(tenantId: string, orderId: string, total: number, warrantyDays: number) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');
    order.total = total;
    order.subtotal = total;
    order.warrantyDays = warrantyDays;
    await this.ordersRepository.save(order);
    return this.findOne(tenantId, orderId);
  }

  async assignTechnician(tenantId: string, orderId: string, technicianId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');
    order.technicianId = technicianId;
    await this.ordersRepository.save(order);
    return this.findOne(tenantId, orderId);
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();

    // Get the highest order number for this tenant and year
    const lastOrder = await this.ordersRepository
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.orderNumber LIKE :prefix', { prefix: `ORD-${year}-%` })
      .orderBy('o.orderNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastOrder) {
      // Extract the number part: ORD-2026-00015 -> 15
      const parts = lastOrder.orderNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `ORD-${year}-${nextNumber.toString().padStart(5, '0')}`;
  }
}
