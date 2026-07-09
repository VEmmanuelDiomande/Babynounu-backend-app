import { Controller, Get, Post, Delete, Param, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetMyMediaUseCase, UploadMediaUseCase, DeleteMediaUseCase } from '../../application/media/media.usecases';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly getMyMediaUseCase: GetMyMediaUseCase,
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyMedia(@Req() req: any) {
    return this.getMyMediaUseCase.execute(req.user.sub);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', description: 'Type de média (photo_profil, photo_banniere, etc.)' },
      },
    },
  })
  async upload(@Req() req: any, @UploadedFile() file: any) {
    const typeMediaSlug = req.body?.type;
    return this.uploadMediaUseCase.execute(req.user.sub, file, typeMediaSlug);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.deleteMediaUseCase.execute(id);
  }
}
