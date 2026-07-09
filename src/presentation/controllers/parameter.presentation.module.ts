import { Module } from '@nestjs/common';
import { ParameterController } from './parameter.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParameterController],
})
export class ParameterPresentationModule {}
