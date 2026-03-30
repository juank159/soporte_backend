import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'tecnico@taller.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.RECEPTION })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
