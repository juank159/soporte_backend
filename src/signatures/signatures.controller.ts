import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { SignaturesService } from './signatures.service';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@ApiTags('Signatures')
@Controller('orders/:orderId/signatures')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a signature to an order' })
  create(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateSignatureDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return this.signaturesService.create(tenantId, orderId, dto, ip);
  }

  @Get()
  @ApiOperation({ summary: 'Get signatures for an order' })
  findByOrder(
    @CurrentTenant() tenantId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.signaturesService.findByOrder(tenantId, orderId);
  }
}
