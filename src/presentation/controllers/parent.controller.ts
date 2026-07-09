import { Body, Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  GetAllParentsUseCase,
  CreateParentProfileUseCase,
  UpdateParentProfileUseCase,
  DeleteParentUseCase,
  GetParentByIdUseCase,
} from '../../application/profile/profile.usecases';
import { CreateParentProfileDto, UpdateProfileDto } from '../dtos/profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Parent')
@Controller('parent')
export class ParentController {
  constructor(
    private readonly getAllParentsUseCase: GetAllParentsUseCase,
    private readonly createParentProfileUseCase: CreateParentProfileUseCase,
    private readonly updateParentProfileUseCase: UpdateParentProfileUseCase,
    private readonly deleteParentUseCase: DeleteParentUseCase,
    private readonly getParentByIdUseCase: GetParentByIdUseCase,
  ) {}

  @Get()
  async list(@Query() query: any) {
    return this.getAllParentsUseCase.execute(query, query.page, query.limit);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getParentByIdUseCase.execute(id);
  }

  @Post('search_parent')
  async search(@Body() body: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.getAllParentsUseCase.execute({ ...body, search: body.fullname }, page, limit);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() dto: CreateParentProfileDto) {
    return this.createParentProfileUseCase.execute(req.user.sub, {
      ...dto,
      email: req.user.email,
    });
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.updateParentProfileUseCase.updateById(id, dto);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.deleteParentUseCase.execute(id);
  }
}
