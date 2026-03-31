import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signature } from './entities/signature.entity';
import { ServiceOrder } from '../orders/entities/service-order.entity';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { CloudinaryService } from '../storage/cloudinary.service';

@Injectable()
export class SignaturesService {
  constructor(
    @InjectRepository(Signature)
    private signaturesRepository: Repository<Signature>,
    @InjectRepository(ServiceOrder)
    private ordersRepository: Repository<ServiceOrder>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    tenantId: string,
    orderId: string,
    dto: CreateSignatureDto,
    ipAddress: string,
  ) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Upload signature to Cloudinary
    let pngUrl = dto.pngData;
    if (pngUrl && (pngUrl.startsWith('data:') || pngUrl.length > 500)) {
      pngUrl = await this.cloudinaryService.uploadSignature(
        pngUrl,
        `soporte/${tenantId}/signatures`,
        `${orderId}_${dto.signerType}`,
      );
    }

    const signature = this.signaturesRepository.create({
      orderId,
      signerType: dto.signerType,
      signerName: dto.signerName,
      svgPath: dto.svgPath,
      pngUrl,
      deviceInfo: dto.deviceInfo,
      ipAddress,
    });

    return this.signaturesRepository.save(signature);
  }

  async findByOrder(tenantId: string, orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.signaturesRepository.find({
      where: { orderId },
      order: { signedAt: 'ASC' },
    });
  }
}
