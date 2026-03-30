import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Mi Taller Tech' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'mi-taller-tech' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: '900123456-7' })
  @IsOptional()
  @IsString()
  nit?: string;

  @ApiPropertyOptional({ example: 'Calle 50 #30-20, Medellín' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '604-1234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@mitaller.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'America/Bogota' })
  @IsOptional()
  @IsString()
  timezone?: string;

  // Admin user to create with the tenant
  @ApiProperty({ example: 'Admin User' })
  @IsNotEmpty()
  @IsString()
  adminName: string;

  @ApiProperty({ example: 'admin@mitaller.com' })
  @IsNotEmpty()
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsNotEmpty()
  @IsString()
  adminPassword: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

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
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  warrantyDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warrantyConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalNotice?: string;
}
