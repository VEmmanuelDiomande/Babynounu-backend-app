import { Controller, Get, Post, Put, Delete, Param, Query, UseGuards, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags } from '@nestjs/swagger';
import {
  GetJobsUseCase,
  GetJobByIdUseCase,
  CreateJobUseCase,
  UpdateJobUseCase,
  DeleteJobUseCase,
  ApplyToJobUseCase,
  GetJobApplicationsUseCase,
  GetMyApplicationsUseCase,
  GetJobOwnerApplicationsUseCase,
} from '../../application/job/job.usecases';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { NounuRestrictionGuard } from '../guards/nounu-restriction.guard';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(NounuRestrictionGuard)
export class JobController {
  constructor(
    private readonly getJobsUseCase: GetJobsUseCase,
    private readonly getJobByIdUseCase: GetJobByIdUseCase,
    private readonly createJobUseCase: CreateJobUseCase,
    private readonly updateJobUseCase: UpdateJobUseCase,
    private readonly deleteJobUseCase: DeleteJobUseCase,
    private readonly applyToJobUseCase: ApplyToJobUseCase,
    private readonly getJobApplicationsUseCase: GetJobApplicationsUseCase,
    private readonly getMyApplicationsUseCase: GetMyApplicationsUseCase,
    private readonly getJobOwnerApplicationsUseCase: GetJobOwnerApplicationsUseCase,
  ) {}

  @Get()
  async list(@Query() query: any) {
    return this.getJobsUseCase.execute(query, query.page, query.limit);
  }

  @Get('applications/me')
  @UseGuards(JwtAuthGuard)
  async getMyApplications(@Req() req: any) {
    return this.getMyApplicationsUseCase.execute(req.user.sub);
  }

  @Get('applications/owner')
  @UseGuards(JwtAuthGuard)
  async getOwnerApplications(@Req() req: any) {
    return this.getJobOwnerApplicationsUseCase.execute(req.user.sub);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getJobByIdUseCase.execute(parseInt(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('Images_videos', 10, {
      storage: diskStorage({
        destination: './uploads/jobs',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async create(@Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    return this.createJobUseCase.execute(req.user.sub, req.body, files || []);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('Images_videos', 10, {
      storage: diskStorage({
        destination: './uploads/jobs',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async update(@Param('id') id: string, @Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    return this.updateJobUseCase.execute(parseInt(id), req.user.sub, req.body, files || []);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.deleteJobUseCase.execute(parseInt(id), req.user.sub);
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  async apply(@Param('id') id: string, @Req() req: any) {
    return this.applyToJobUseCase.execute(req.user.sub, parseInt(id));
  }

  @Get(':id/applications')
  async getApplications(@Param('id') id: string) {
    return this.getJobApplicationsUseCase.execute(parseInt(id));
  }
}
