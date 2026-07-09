import { Module } from '@nestjs/common';
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
} from './job.usecases';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaJobRepository, PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { NotificationApplicationModule } from '../notification/notification.application.module';

@Module({
  imports: [PrismaModule, NotificationApplicationModule],
  providers: [
    PrismaJobRepository,
    GetJobsUseCase,
    GetJobByIdUseCase,
    CreateJobUseCase,
    UpdateJobUseCase,
    DeleteJobUseCase,
    ApplyToJobUseCase,
    GetJobApplicationsUseCase,
    GetMyApplicationsUseCase,
    GetJobOwnerApplicationsUseCase,
    PrismaNotificationRepository,
  ],
  exports: [
    GetJobsUseCase,
    GetJobByIdUseCase,
    CreateJobUseCase,
    UpdateJobUseCase,
    DeleteJobUseCase,
    ApplyToJobUseCase,
    GetJobApplicationsUseCase,
    GetMyApplicationsUseCase,
    GetJobOwnerApplicationsUseCase,
  ],
})
export class JobApplicationModule {}
