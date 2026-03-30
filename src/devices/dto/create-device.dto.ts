import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Celular' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: 'Samsung' })
  @IsNotEmpty()
  @IsString()
  brand: string;

  @ApiProperty({ example: 'Galaxy S24' })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiPropertyOptional({ example: 'RZ8G1234ABC' })
  @IsOptional()
  @IsString()
  serial?: string;

  @ApiPropertyOptional({ example: '351234567890123' })
  @IsOptional()
  @IsString()
  imei?: string;

  @ApiPropertyOptional({ example: 'Negro' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: ['Cargador', 'Funda'] })
  @IsOptional()
  @IsArray()
  accessories?: string[];
}
