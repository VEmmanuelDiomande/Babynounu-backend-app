import { Body, Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import {
  GetAllNounusUseCase,
  SearchNounusUseCase,
  GetNounuProfileUseCase,
  CreateNounuProfileUseCase,
  UpdateNounuProfileUseCase,
  DeleteNounuUseCase,
} from '../../application/profile/profile.usecases';
import { CreateNounuProfileDto, UpdateNounuProfileDto } from '../dtos/profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ParentRestrictionGuard } from '../guards/parent-restriction.guard';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@ApiTags('Nounu')
@Controller('nounu')
@UseGuards(ParentRestrictionGuard)
export class NounuController {
  constructor(
    @Inject(GetAllNounusUseCase) private readonly getAllNounusUseCase: GetAllNounusUseCase,
    @Inject(SearchNounusUseCase) private readonly searchNounusUseCase: SearchNounusUseCase,
    @Inject(GetNounuProfileUseCase) private readonly getNounuProfileUseCase: GetNounuProfileUseCase,
    @Inject(CreateNounuProfileUseCase) private readonly createNounuProfileUseCase: CreateNounuProfileUseCase,
    @Inject(UpdateNounuProfileUseCase) private readonly updateNounuProfileUseCase: UpdateNounuProfileUseCase,
    @Inject(DeleteNounuUseCase) private readonly deleteNounuUseCase: DeleteNounuUseCase,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@Query() query: any) {
    return this.getAllNounusUseCase.execute(query, query.page, query.limit);
  }

  @Get('all')
  async listAll(@Query() query: any) {
    return this.getAllNounusUseCase.execute(query, query.page, query.limit);
  }

  @Get('non-certified')
  async nonCertified(@Query() query: any) {
    const options = { page: parseInt(query.page) || 1, limit: parseInt(query.limit) || 10 };
    const skip = (options.page - 1) * options.limit;
    const where: any = { certif: 'Pending', deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.profilNounu.findMany({
        where,
        skip,
        take: options.limit,
        include: { user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } }, preferences: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profilNounu.count({ where }),
    ]);
    return { data, pagination: { total, page: options.page, limit: options.limit, totalPages: Math.ceil(total / options.limit) } };
  }

  @Get(':id')
  @UseGuards(SubscriptionGuard)
  async getById(@Param('id') id: string) {
    return this.getNounuProfileUseCase.execute(id);
  }

  @Post('search')
  async search(@Body() body: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.searchNounusUseCase.execute(body, page, limit);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() dto: CreateNounuProfileDto) {
    return this.createNounuProfileUseCase.execute(req.user.sub, dto);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateNounuProfileDto) {
    return this.updateNounuProfileUseCase.updateById(id, dto, req.user.sub);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.deleteNounuUseCase.execute(id, req.user.sub);
  }

  @Post('approve-certification/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async approveCertification(@Param('id') id: string) {
    return this.prisma.profilNounu.update({
      where: { id },
      data: { certif: 'Approved' },
      include: { user: true },
    });
  }

  @Post('reject-certification/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async rejectCertification(@Param('id') id: string) {
    return this.prisma.profilNounu.update({
      where: { id },
      data: { certif: 'Rejected' },
      include: { user: true },
    });
  }

  @Post('update-status/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.prisma.profilNounu.update({
      where: { id },
      data: { status: body.status as any },
      include: { user: true },
    });
  }
}
