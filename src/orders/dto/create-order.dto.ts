import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../entities/service-order.entity';
import { EquipmentStatus } from '../entities/order-equipment.entity';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'Pantalla LCD Samsung S24' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  qty: number;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  unitPrice: number;
}

export class EquipmentDto {
  @ApiProperty({ example: 'Celular' })
  @IsNotEmpty()
  @IsString()
  deviceType: string;

  @ApiProperty({ example: 'Samsung' })
  @IsNotEmpty()
  @IsString()
  deviceBrand: string;

  @ApiProperty({ example: 'Galaxy S24' })
  @IsNotEmpty()
  @IsString()
  deviceModel: string;

  @ApiPropertyOptional({ example: 'RZ8G1234ABC' })
  @IsOptional()
  @IsString()
  deviceSerial?: string;

  @ApiPropertyOptional({ example: 'Negro' })
  @IsOptional()
  @IsString()
  deviceColor?: string;

  @ApiPropertyOptional({ example: ['Cargador', 'Funda'] })
  @IsOptional()
  @IsArray()
  accessories?: string[];

  @ApiProperty({ example: 'No enciende, se mojó ayer' })
  @IsNotEmpty()
  @IsString()
  problemReported: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicianId?: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional()
  @IsString()
  unlockPassword?: string;

  @ApiPropertyOptional({ example: '9876' })
  @IsOptional()
  @IsString()
  unlockPin?: string;

  @ApiPropertyOptional({ example: 'L invertida' })
  @IsOptional()
  @IsString()
  unlockPattern?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Existing customer ID' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  // Single device (backward compatible)
  @ApiPropertyOptional({ example: 'Celular' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ example: 'Samsung' })
  @IsOptional()
  @IsString()
  deviceBrand?: string;

  @ApiPropertyOptional({ example: 'Galaxy S24' })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional({ example: 'RZ8G1234ABC' })
  @IsOptional()
  @IsString()
  deviceSerial?: string;

  @ApiPropertyOptional({ example: '351234567890123' })
  @IsOptional()
  @IsString()
  deviceImei?: string;

  @ApiPropertyOptional({ example: 'Negro' })
  @IsOptional()
  @IsString()
  deviceColor?: string;

  @ApiPropertyOptional({ example: ['Cargador', 'Funda'] })
  @IsOptional()
  @IsArray()
  accessories?: string[];

  @ApiPropertyOptional({ example: 'No enciende, se mojó ayer' })
  @IsOptional()
  @IsString()
  problemReported?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicianId?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded device photos' })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiPropertyOptional({ example: 'abc123' })
  @IsOptional()
  @IsString()
  unlockPassword?: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional()
  @IsString()
  unlockPin?: string;

  @ApiPropertyOptional({ example: '1-5-9' })
  @IsOptional()
  @IsString()
  unlockPattern?: string;

  // Multiple devices
  @ApiPropertyOptional({ description: 'Array of equipment for multi-device orders' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentDto)
  equipments?: EquipmentDto[];

  @ApiPropertyOptional({ description: 'Whether client signature is required on delivery', default: true })
  @IsOptional()
  @IsBoolean()
  requiresClientSignature?: boolean;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEquipmentStatusDto {
  @ApiProperty({ enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  warrantyDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  laborCost?: number;

  @ApiPropertyOptional({ example: 'efectivo' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class AddDiagnosisDto {
  @ApiProperty({ example: 'Daño en placa por humedad. Requiere cambio de IC de carga.' })
  @IsNotEmpty()
  @IsString()
  diagnosis: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 80000 })
  @IsOptional()
  @IsNumber()
  laborCost?: number;
}
