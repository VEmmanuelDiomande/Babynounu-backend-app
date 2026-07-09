// src/interceptors/sharp-disk.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import sharp from 'sharp';
import { Logger } from '@nestjs/common';
import { createReadStream, unlinkSync, existsSync } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pump = promisify(pipeline);

@Injectable()
export class SharpDiskInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SharpDiskInterceptor.name);

  constructor(private options: {
    fields: string[];
    resizeOptions: {
      width: number;
      height: number;
      fit?: string;
      quality?: number;
    };
  }) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    if (req.files) {
      for (const field of this.options.fields) {
        if (req.files[field]) {
          for (const file of req.files[field]) {
            // try {
              if (!file.path) {
                throw new Error('Chemin de fichier manquant');
              }

              // Chemin de sortie pour l'image traitée
              const outputFile = `./uploads/${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '.jpg')}`;

              // Traitement avec Sharp
              await sharp(file.path)
                .resize({
                  width: this.options.resizeOptions.width,
                  height: this.options.resizeOptions.height,
                  fit: (this.options.resizeOptions.fit || 'cover') as any,
                  withoutEnlargement: true
                })
                .jpeg({ 
                  quality: this.options.resizeOptions.quality || 80,
                  mozjpeg: true 
                })
                .toFile(outputFile);

              // Supprime le fichier temporaire
            //   if (existsSync(file.path)) {
            //     unlinkSync(file.path);
            //   }

              // Met à jour les infos du fichier
              file.path = outputFile;
              file.mimetype = 'image/jpeg';
              file.filename = outputFile.split('/').pop();
              file.originalname = file.originalname.replace(/\.[^/.]+$/, '.jpg');

            // } catch (error) {
            //   this.logger.error(`Erreur de traitement: ${error.message}`);
            //   if (existsSync(file.path)) {
            //     unlinkSync(file.path);
            //   }
            //   return throwError(() => new Error('Échec du traitement de l\'image'));
            // }
          }
        }
      }
    }

    return next.handle();
  }
}

export const SharpTransform = (options: {
  fields: string[];
  resizeOptions: {
    width: number;
    height: number;
    fit?: string;
    quality?: number;
  };
}) => new SharpDiskInterceptor(options);