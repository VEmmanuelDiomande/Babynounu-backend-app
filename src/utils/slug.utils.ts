import slugify from 'slugify';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

export class SlugUtils {
  constructor() {}

  async slug(text: string, prisma: PrismaService) {
    let newSlug: object | null;
    const _slug = slugify(`${text}-${Math.random().toString().substr(2, 6)}-baby`, {
      replacement: '-',
      lower: true,
      trim: true,
      strict: false,
    });

    do {
      newSlug = await prisma.user.findUnique({
        where: { slug: _slug },
      });
    } while (newSlug);

    return _slug;
  }


  async all(text: string, prisma: PrismaService, model: 'user' | 'profilNounu' | 'profilParent' = 'user') {
    let newSlug: object | null;
    const _slug = slugify(`${text}-${Math.random().toString().substr(2, 6)}`, {
      replacement: '-',
      lower: true,
      trim: true,
      strict: false,
    });

    do {
      newSlug = await (prisma as any)[model].findUnique({
        where: { slug: _slug },
      });
    } while (newSlug);

    return _slug;
  }
}
