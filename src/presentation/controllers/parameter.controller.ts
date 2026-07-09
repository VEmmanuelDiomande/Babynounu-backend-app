import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@ApiTags('Parameters')
@Controller('parameters')
export class ParameterController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('typeSlug') typeSlug?: string) {
    const where: any = { deletedAt: null };
    if (typeSlug) {
      where.typeParameter = { slug: typeSlug };
    }
    return this.prisma.parameter.findMany({
      where,
      include: { typeParameter: true },
      orderBy: { priority: 'asc' },
    });
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.prisma.parameter.findMany({
      where: { slug, deletedAt: null },
      include: { typeParameter: true },
      orderBy: { priority: 'asc' },
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.prisma.parameter.findUnique({
      where: { id: parseInt(id) },
      include: { typeParameter: true },
    });
  }
}
