import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customers' })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll(tenantId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.customersService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(tenantId, id, dto);
  }
}
