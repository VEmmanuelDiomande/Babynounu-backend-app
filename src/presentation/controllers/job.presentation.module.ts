import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobApplicationModule } from '../../application/job/job.application.module';
import { JwtModule } from '@nestjs/jwt';
import { NounuRestrictionGuard } from '../guards/nounu-restriction.guard';

@Module({
  imports: [
    JobApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [JobController],
  providers: [NounuRestrictionGuard],
})
export class JobPresentationModule {}
