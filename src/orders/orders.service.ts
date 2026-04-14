import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder, OrderStatus } from './entities/service-order.entity';
import { OrderEquipment, EquipmentStatus } from './entities/order-equipment.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPhoto } from './entities/order-photo.entity';
import { OrderHistory } from './entities/order-history.entity';
import { Device } from '../devices/entities/device.entity';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdateEquipmentStatusDto,
  AddDiagnosisDto,
} from './dto/create-order.dto';
import { CloudinaryService } from '../storage/cloudinary.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(ServiceOrder)
    private ordersRepository: Repository<ServiceOrder>,
    @InjectRepository(OrderEquipment)
    private equipmentRepository: Repository<OrderEquipment>,
    @InjectRepository(OrderItem)
    private itemsRepository: Repository<OrderItem>,
    @InjectRepository(OrderPhoto)
    private photosRepository: Repository<OrderPhoto>,
    @InjectRepository(OrderHistory)
    private historyRepository: Repository<OrderHistory>,
    private cloudinaryService: CloudinaryService,
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

  async create(tenantId: string, dto: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber(tenantId);

    // Determine if multi-device or single-device
    const hasEquipments = dto.equipments && dto.equipments.length > 0;

    let savedDevice: Device | null = null;

    // For backward compatibility: if single device fields are provided, create Device
    if (!hasEquipments && dto.deviceType) {
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
      savedDevice = await this.devicesRepository.save(device);
    }

    // Create order
    const order = this.ordersRepository.create({
      tenantId,
      orderNumber,
      customerId: dto.customerId,
      deviceId: savedDevice?.id || null,
      technicianId: dto.technicianId,
      problemReported: dto.problemReported || (hasEquipments ? 'Ver equipos' : ''),
      status: OrderStatus.RECEIVED,
    });
    const savedOrder = await this.ordersRepository.save(order);

    // Save equipments if multi-device
    if (hasEquipments) {
      for (const eq of dto.equipments) {
        const equipment = this.equipmentRepository.create({
          orderId: savedOrder.id,
          deviceType: eq.deviceType,
          deviceBrand: eq.deviceBrand,
          deviceModel: eq.deviceModel,
          deviceSerial: eq.deviceSerial,
          deviceColor: eq.deviceColor,
          accessories: eq.accessories,
          problemReported: eq.problemReported,
          technicianId: eq.technicianId,
          status: EquipmentStatus.RECEIVED,
        });
        await this.equipmentRepository.save(equipment);
      }
    }

    // Save photos if provided (for single device)
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
      .leftJoinAndSelect('o.equipments', 'eq')
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
      relations: ['customer', 'device', 'equipments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id, tenantId },
      relations: ['customer', 'device', 'items', 'signatures', 'equipments'],
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
      relations: ['customer', 'device', 'items', 'signatures', 'equipments'],
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
    await this.addHistory(id, fromStatus, dto.status, dto.notes, userId, userName);

    return this.findOne(tenantId, id);
  }

  // ===== EQUIPMENT STATUS =====
  async updateEquipmentStatus(
    tenantId: string,
    orderId: string,
    equipmentId: string,
    dto: UpdateEquipmentStatusDto,
    userId?: string,
    userName?: string,
  ) {
    // Verify order belongs to tenant
    await this.findOne(tenantId, orderId);

    const equipment = await this.equipmentRepository.findOne({
      where: { id: equipmentId, orderId },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const fromStatus = equipment.status;
    equipment.status = dto.status;
    if (dto.notes) equipment.notes = dto.notes;

    if (dto.status === EquipmentStatus.DELIVERED) {
      equipment.deliveredAt = new Date();
    }
    if (dto.status === EquipmentStatus.CLOSED) {
      equipment.closedAt = new Date();
    }

    await this.equipmentRepository.save(equipment);

    // Add to order history with equipment reference
    const eqLabel = `${equipment.deviceType} ${equipment.deviceBrand} ${equipment.deviceModel}`;
    await this.addHistory(
      orderId,
      fromStatus,
      dto.status,
      `[${eqLabel}] ${dto.notes || ''}`.trim(),
      userId,
      userName,
    );

    // Auto-update order status based on equipment statuses
    await this.syncOrderStatus(tenantId, orderId);

    return this.findOne(tenantId, orderId);
  }

  async addEquipmentDiagnosis(
    tenantId: string,
    orderId: string,
    equipmentId: string,
    diagnosis: string,
    laborCost?: number,
  ) {
    await this.findOne(tenantId, orderId);

    const equipment = await this.equipmentRepository.findOne({
      where: { id: equipmentId, orderId },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    equipment.diagnosis = diagnosis;
    equipment.status = EquipmentStatus.DIAGNOSING;
    if (laborCost !== undefined) {
      equipment.laborCost = laborCost;
    }

    await this.equipmentRepository.save(equipment);
    return this.findOne(tenantId, orderId);
  }

  async assignEquipmentTechnician(
    tenantId: string,
    orderId: string,
    equipmentId: string,
    technicianId: string,
  ) {
    await this.findOne(tenantId, orderId);

    const equipment = await this.equipmentRepository.findOne({
      where: { id: equipmentId, orderId },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    equipment.technicianId = technicianId;
    await this.equipmentRepository.save(equipment);
    return this.findOne(tenantId, orderId);
  }

  private async syncOrderStatus(tenantId: string, orderId: string) {
    const equipments = await this.equipmentRepository.find({
      where: { orderId },
    });
    if (equipments.length === 0) return;

    const statuses = equipments.map((e) => e.status);
    let orderStatus: OrderStatus;

    // If all are delivered/closed/returned → order is delivered
    if (statuses.every((s) => [EquipmentStatus.DELIVERED, EquipmentStatus.CLOSED, EquipmentStatus.RETURNED].includes(s))) {
      orderStatus = OrderStatus.DELIVERED;
    }
    // If all closed/returned → closed
    else if (statuses.every((s) => [EquipmentStatus.CLOSED, EquipmentStatus.RETURNED].includes(s))) {
      orderStatus = OrderStatus.CLOSED;
    }
    // If any is repairing → repairing
    else if (statuses.some((s) => s === EquipmentStatus.REPAIRING)) {
      orderStatus = OrderStatus.REPAIRING;
    }
    // If any is diagnosing → diagnosing
    else if (statuses.some((s) => s === EquipmentStatus.DIAGNOSING)) {
      orderStatus = OrderStatus.DIAGNOSING;
    }
    // If any is quality_check → quality_check
    else if (statuses.some((s) => s === EquipmentStatus.QUALITY_CHECK)) {
      orderStatus = OrderStatus.QUALITY_CHECK;
    }
    // If any is ready → ready
    else if (statuses.some((s) => s === EquipmentStatus.READY)) {
      orderStatus = OrderStatus.READY;
    }
    // Default: received
    else {
      orderStatus = OrderStatus.RECEIVED;
    }

    await this.ordersRepository.update(orderId, { status: orderStatus });
  }

  async addDiagnosis(tenantId: string, id: string, dto: AddDiagnosisDto) {
    const order = await this.ordersRepository.findOne({
      where: { id, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    order.diagnosis = dto.diagnosis;
    order.status = OrderStatus.DIAGNOSING;

    if (dto.laborCost !== undefined) {
      order.laborCost = dto.laborCost;
    }

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

    const allItems = await this.itemsRepository.find({
      where: { orderId: id },
    });
    const itemsTotal = allItems.reduce((sum, i) => sum + Number(i.total), 0);
    order.subtotal = itemsTotal + Number(order.laborCost);
    order.tax = order.subtotal * 0.19;
    order.total = order.subtotal + order.tax;

    await this.ordersRepository.save(order);
    return this.findOne(tenantId, id);
  }

  async addPhoto(tenantId: string, orderId: string, photoUrl: string, description?: string, stage?: string) {
    await this.findOne(tenantId, orderId);

    let finalUrl = photoUrl;
    if (photoUrl.startsWith('data:') || photoUrl.length > 500) {
      finalUrl = await this.cloudinaryService.uploadBase64(
        photoUrl,
        `soporte/${tenantId}/orders/${orderId}`,
      );
    }

    const photo = this.photosRepository.create({
      orderId,
      photoUrl: finalUrl,
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

    const lastOrder = await this.ordersRepository
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.orderNumber LIKE :prefix', { prefix: `ORD-${year}-%` })
      .orderBy('o.orderNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastOrder) {
      const parts = lastOrder.orderNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `ORD-${year}-${nextNumber.toString().padStart(5, '0')}`;
  }
}
