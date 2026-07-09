import { Controller, Get, Post, Put, UseGuards, Req, Param, UseInterceptors, BadRequestException } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { validate } from 'class-validator';
import {
  GetUserProfileUseCase,
  CreateParentProfileUseCase,
  UpdateParentProfileUseCase,
  CreateNounuProfileUseCase,
  UpdateNounuProfileUseCase,
  GetNounuProfileUseCase,
  GetMyNounuProfileUseCase,
  GetMyParentProfileUseCase,
} from '../../application/profile/profile.usecases';
import { CreateParentProfileDto, CreateNounuProfileDto, UpdateNounuProfileDto } from '../dtos/profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly createParentProfileUseCase: CreateParentProfileUseCase,
    private readonly updateParentProfileUseCase: UpdateParentProfileUseCase,
    private readonly createNounuProfileUseCase: CreateNounuProfileUseCase,
    private readonly updateNounuProfileUseCase: UpdateNounuProfileUseCase,
    private readonly getNounuProfileUseCase: GetNounuProfileUseCase,
    private readonly getMyNounuProfileUseCase: GetMyNounuProfileUseCase,
    private readonly getMyParentProfileUseCase: GetMyParentProfileUseCase,
  ) {
    mkdirSync('./uploads', { recursive: true });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Profil utilisateur complet' })
  async getMyProfile(@Req() req: any) {
    return this.getUserProfileUseCase.execute(req.user.sub);
  }

  // === PARENT ===

  @Get('parent/me')
  @UseGuards(JwtAuthGuard)
  async getMyParentProfile(@Req() req: any) {
    return this.getMyParentProfileUseCase.execute(req.user.sub);
  }

  @Post('parent')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createParentProfile(@Req() req: any) {
    const dto = await this.mapParentProfileBody(req.body);
    return this.createParentProfileUseCase.execute(req.user.sub, { ...dto, email: req.user.email }, req.body, req.files || []);
  }

  @Put('parent')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateParentProfile(@Req() req: any) {
    const dto = await this.mapParentProfileBody(req.body);
    return this.updateParentProfileUseCase.execute(req.user.sub, dto, req.body, req.files || []);
  }

  // === NOUNU ===

  @Get('nounu/me')
  @UseGuards(JwtAuthGuard)
  async getMyNounuProfile(@Req() req: any) {
    return this.getMyNounuProfileUseCase.execute(req.user.sub);
  }

  @Get('nounu/:id')
  async getNounuProfile(@Param('id') id: string) {
    return this.getNounuProfileUseCase.execute(id);
  }

  @Post('nounu')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createNounuProfile(@Req() req: any) {
    const dto = await this.mapNounuProfileBody(req.body);
    return this.createNounuProfileUseCase.execute(req.user.sub, dto, req.body, req.files || []);
  }

  @Put('nounu')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateNounuProfile(@Req() req: any) {
    const dto = (await this.mapNounuProfileBody(req.body)) as UpdateNounuProfileDto;
    return this.updateNounuProfileUseCase.execute(req.user.sub, dto, req.body, req.files || []);
  }

  /**
   * Convertit les champs snake_case envoyés par le frontend (multipart/form-data)
   * en DTO camelCase attendu par le use case, puis valide ce DTO.
   */
  private async mapNounuProfileBody(body: any): Promise<CreateNounuProfileDto> {
    const dto = new CreateNounuProfileDto();
    dto.fullname = body.fullname ?? '';
    dto.age = body.age ?? '';
    dto.phone = body.phone ?? '';
    dto.anneesExperience = body.annees_experience ?? body.anneesExperience ?? '';
    dto.tarifHoraire = body.tarif_horaire ?? body.tarifHoraire ?? '';
    dto.tarifMensuel = body.tarif_mensuel ?? body.tarifMensuel ?? '';
    dto.evaluationPrecedentes = body.evaluation_precedentes ?? body.evaluationPrecedentes ?? '';
    dto.references = body.references ?? '';
    dto.courteBiographie = body.courte_biographie ?? body.courteBiographie ?? '';
    dto.status = body.status ?? 'disponible';
    dto.certif = body.certif ?? 'Pending';

    const errors = await validate(dto);
    if (errors.length > 0) {
      const messages = errors.map((err) => ({
        path: err.property,
        message: Object.values(err.constraints || {})[0],
      }));
      throw new BadRequestException({ message: messages, error: 'Bad Request' });
    }

    return dto;
  }

  /**
   * Convertit les champs snake_case envoyés par le frontend (multipart/form-data)
   * en DTO camelCase attendu par le use case parent, puis valide ce DTO.
   */
  private async mapParentProfileBody(body: any): Promise<CreateParentProfileDto> {
    const dto = new CreateParentProfileDto();
    dto.fullname = body.fullname ?? '';
    dto.phone = body.phone ?? '';
    dto.numberOfChildren = body.number_of_children ?? body.numberOfChildren ?? '';
    dto.budgetEstimated = body.budget_estimated ?? body.budgetEstimated ?? '';
    dto.informationsComplementaires = body.informations_complementaires ?? body.informationsComplementaires ?? '';

    const errors = await validate(dto);
    if (errors.length > 0) {
      const messages = errors.map((err) => ({
        path: err.property,
        message: Object.values(err.constraints || {})[0],
      }));
      throw new BadRequestException({ message: messages, error: 'Bad Request' });
    }

    return dto;
  }
}
