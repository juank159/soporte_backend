import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../entities/service-order.entity';

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

export class CreateOrderDto {
  // Customer data (can reference existing or create inline)
  @ApiProperty({ description: 'Existing customer ID' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  // Device data
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

  // Order data
  @ApiProperty({ example: 'No enciende, se mojó ayer' })
  @IsNotEmpty()
  @IsString()
  problemReported: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicianId?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded device photos' })
  @IsOptional()
  @IsArray()
  photos?: string[];
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
