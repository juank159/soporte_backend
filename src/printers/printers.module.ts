import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintersService } from './printers.service';
import { PrintersController } from './printers.controller';
import { Printer } from './entities/printer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Printer])],
  controllers: [PrintersController],
  providers: [PrintersService],
  exports: [PrintersService],
})
export class PrintersModule {}
