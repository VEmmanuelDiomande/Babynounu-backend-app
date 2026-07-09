import { Module } from '@nestjs/common';
import { PrismaUserRepository, PrismaProfileRepository } from './user.repository';
import { IUserRepository, IProfileRepository } from '../../domain';

@Module({
  providers: [
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'IProfileRepository',
      useClass: PrismaProfileRepository,
    },
    PrismaUserRepository,
    PrismaProfileRepository,
  ],
  exports: [
    'IUserRepository',
    'IProfileRepository',
    PrismaUserRepository,
    PrismaProfileRepository,
  ],
})
export class RepositoriesModule {}
