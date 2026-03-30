import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'María García' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '1020304050' })
  @IsNotEmpty()
  @IsString()
  idNumber: string;

  @ApiProperty({ example: '3001234567' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
