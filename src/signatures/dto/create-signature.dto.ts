import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignerType } from '../entities/signature.entity';

export class CreateSignatureDto {
  @ApiProperty({ enum: SignerType })
  @IsEnum(SignerType)
  signerType: SignerType;

  @ApiProperty({ example: 'María García' })
  @IsNotEmpty()
  @IsString()
  signerName: string;

  @ApiPropertyOptional({ description: 'SVG path data of the signature' })
  @IsOptional()
  @IsString()
  svgPath?: string;

  @ApiProperty({ description: 'Base64 PNG of the signature' })
  @IsNotEmpty()
  @IsString()
  pngData: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
