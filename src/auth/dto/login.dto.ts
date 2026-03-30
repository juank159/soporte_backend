import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@taller.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'mi-taller', description: 'Slug del tenant' })
  @IsNotEmpty()
  @IsString()
  tenantSlug: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
