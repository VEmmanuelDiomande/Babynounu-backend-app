import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SignUpUseCase, SignInUseCase } from './auth.usecases';
import { IUserRepository } from '../../domain';

describe('SignUpUseCase', () => {
  let useCase: SignUpUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SignUpUseCase,
        {
          provide: 'IUserRepository',
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            getProfile: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findParameterBySlug: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(SignUpUseCase);
    userRepo = moduleRef.get('IUserRepository') as jest.Mocked<IUserRepository>;
    jwtService = moduleRef.get(JwtService) as jest.Mocked<JwtService>;

    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const input = {
      email: 'nounu@test.com',
      password: 'password123',
      type_profil: 'nounu',
    };

    it('should register a new nounu user successfully', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findParameterBySlug.mockImplementation((slug: string) => {
        if (slug === 'prestataire') return Promise.resolve({ id: 10, slug: 'prestataire', name: 'Prestataire' });
        if (slug === 'nounou') return Promise.resolve({ id: 20, slug: 'nounou', name: 'Nounou' });
        return Promise.resolve(null);
      });
      userRepo.create.mockResolvedValue({
        id: 'user-1',
        slug: 'nounu-123',
        email: input.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('access-token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue(null);

      const result = await useCase.execute(input);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
      expect(userRepo.findParameterBySlug).toHaveBeenCalledWith('prestataire');
      expect(userRepo.findParameterBySlug).toHaveBeenCalledWith('nounou');
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: input.email,
          roleId: 20,
          typeProfilId: 10,
        }),
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        accessToken: 'access-token',
        refreshToken: 'access-token',
      });
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe(input.email);
      expect(result.user.access_token).toBe('access-token');
      expect(result.user.refresh_token).toBe('access-token');
      expect(result.user.role).toEqual({
        id: 20,
        slug: 'nounu',
        name: 'Nounou',
      });
      expect(result.user.type_profil).toEqual({
        id: 10,
        slug: 'nounu',
        name: 'Prestataire',
        description: 'Prestataire',
      });
      expect(result.user.profil).toEqual([]);
    });

    it('should throw BadRequestException if email already exists', async () => {
      userRepo.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: input.email,
        slug: 'existing',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(input)).rejects.toThrow('Cet email est déjà utilisé');
    });

    it('should hash the password before saving', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findParameterBySlug.mockImplementation((slug: string) => {
        if (slug === 'prestataire') return Promise.resolve({ id: 10, slug: 'prestataire', name: 'Prestataire' });
        if (slug === 'nounou') return Promise.resolve({ id: 20, slug: 'nounou', name: 'Nounou' });
        return Promise.resolve(null);
      });
      userRepo.create.mockResolvedValue({
        id: 'user-1',
        slug: 'nounu-123',
        email: input.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue(null);

      await useCase.execute(input);

      const createCall = userRepo.create.mock.calls[0][0];
      expect(createCall.password).not.toBe(input.password);
      const isHashed = await bcrypt.compare(input.password, createCall.password);
      expect(isHashed).toBe(true);
    });

    it('should generate a slug from email if not provided', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findParameterBySlug.mockImplementation((slug: string) => {
        if (slug === 'prestataire') return Promise.resolve({ id: 10, slug: 'prestataire', name: 'Prestataire' });
        if (slug === 'nounou') return Promise.resolve({ id: 20, slug: 'nounou', name: 'Nounou' });
        return Promise.resolve(null);
      });
      userRepo.create.mockResolvedValue({
        id: 'user-1',
        slug: 'generated-slug',
        email: input.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue(null);

      await useCase.execute(input);

      const createCall = userRepo.create.mock.calls[0][0];
      expect(createCall.slug).toContain('nounu');
    });

    it('should use provided slug if given', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findParameterBySlug.mockImplementation((slug: string) => {
        if (slug === 'prestataire') return Promise.resolve({ id: 10, slug: 'prestataire', name: 'Prestataire' });
        if (slug === 'nounou') return Promise.resolve({ id: 20, slug: 'nounou', name: 'Nounou' });
        return Promise.resolve(null);
      });
      userRepo.create.mockResolvedValue({
        id: 'user-1',
        slug: 'custom-slug',
        email: input.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue(null);

      await useCase.execute({ ...input, slug: 'custom-slug' });

      const createCall = userRepo.create.mock.calls[0][0];
      expect(createCall.slug).toBe('custom-slug');
    });

    it('should map parent type_profil to the client parameter', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findParameterBySlug.mockImplementation((slug: string) => {
        if (slug === 'client') return Promise.resolve({ id: 30, slug: 'client', name: 'Client' });
        if (slug === 'parent') return Promise.resolve({ id: 40, slug: 'parent', name: 'Parent' });
        return Promise.resolve(null);
      });
      userRepo.create.mockResolvedValue({
        id: 'user-1',
        slug: 'parent-123',
        email: input.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue(null);

      await useCase.execute({ ...input, type_profil: 'parent' });

      expect(userRepo.findParameterBySlug).toHaveBeenCalledWith('client');
      expect(userRepo.findParameterBySlug).toHaveBeenCalledWith('parent');
      const createCall = userRepo.create.mock.calls[0][0];
      expect(createCall.typeProfilId).toBe(30);
      expect(createCall.roleId).toBe(40);
    });

    it('should map admin type_profil to the administrateur parameter', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.findParameterBySlug.mockImplementation((slug: string) => {
        if (slug === 'administrateur') return Promise.resolve({ id: 50, slug: 'administrateur', name: 'Administrateur' });
        if (slug === 'admin') return Promise.resolve({ id: 60, slug: 'admin', name: 'Administrateur' });
        return Promise.resolve(null);
      });
      userRepo.create.mockResolvedValue({
        id: 'user-1',
        slug: 'admin-123',
        email: input.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue(null);

      await useCase.execute({ ...input, type_profil: 'admin' });

      expect(userRepo.findParameterBySlug).toHaveBeenCalledWith('administrateur');
      expect(userRepo.findParameterBySlug).toHaveBeenCalledWith('admin');
      const createCall = userRepo.create.mock.calls[0][0];
      expect(createCall.typeProfilId).toBe(50);
      expect(createCall.roleId).toBe(60);
    });
  });
});

describe('SignInUseCase', () => {
  let useCase: SignInUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SignInUseCase,
        {
          provide: 'IUserRepository',
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            getProfile: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findParameterBySlug: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(SignInUseCase);
    userRepo = moduleRef.get('IUserRepository') as jest.Mocked<IUserRepository>;
    jwtService = moduleRef.get(JwtService) as jest.Mocked<JwtService>;

    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const input = {
      email: 'nounu@test.com',
      password: 'password123',
    };

    const hashedPassword = bcrypt.hashSync(input.password, 10);

    it('should login successfully with valid credentials', async () => {
      userRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        slug: 'nounu-123',
        email: input.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('access-token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue({
        id: 'user-1',
        email: input.email,
        slug: 'nounu-123',
        role: { id: 1, slug: 'nounu', name: 'Nounu' },
        typeProfil: { id: 2, slug: 'nounu', name: 'Nounu' },
        nounu: [{ id: 'nounu-1', fullname: 'Test Nounu' }],
        parent: [],
      } as any);

      const result = await useCase.execute(input);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        accessToken: 'access-token',
        refreshToken: 'access-token',
      });
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe(input.email);
      expect(result.user.access_token).toBe('access-token');
      expect(result.user.profil).toEqual([{ id: 'nounu-1', fullname: 'Test Nounu' }]);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(input)).rejects.toThrow('Email ou mot de passe incorrect');
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      userRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        slug: 'nounu-123',
        email: input.email,
        password: bcrypt.hashSync('different-password', 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(input)).rejects.toThrow('Email ou mot de passe incorrect');
    });

    it('should include parent profiles in the profil array if present', async () => {
      userRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        slug: 'parent-123',
        email: input.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue({
        id: 'user-1',
        email: input.email,
        slug: 'parent-123',
        role: { id: 2, slug: 'parent', name: 'Parent' },
        typeProfil: { id: 1, slug: 'parent', name: 'Parent' },
        nounu: [],
        parent: [{ id: 'parent-1', fullname: 'Test Parent' }],
      } as any);

      const result = await useCase.execute(input);

      expect(result.user.profil).toEqual([{ id: 'parent-1', fullname: 'Test Parent' }]);
    });

    it('should return empty profil array if no profiles exist', async () => {
      userRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        slug: 'nounu-123',
        email: input.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jwtService.signAsync.mockResolvedValue('token');
      userRepo.update.mockResolvedValue({} as any);
      userRepo.getProfile.mockResolvedValue({
        id: 'user-1',
        email: input.email,
        slug: 'nounu-123',
        nounu: [],
        parent: [],
      } as any);

      const result = await useCase.execute(input);

      expect(result.user.profil).toEqual([]);
    });
  });
});
