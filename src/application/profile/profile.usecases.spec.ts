import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateNounuProfileUseCase } from './profile.usecases';
import { IUserRepository, IProfileRepository } from '../../domain';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('CreateNounuProfileUseCase', () => {
  let useCase: CreateNounuProfileUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let profileRepo: jest.Mocked<IProfileRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateNounuProfileUseCase,
        {
          provide: 'IUserRepository',
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findBySlug: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getProfile: jest.fn(),
          },
        },
        {
          provide: 'IProfileRepository',
          useValue: {
            findNounuByUserId: jest.fn(),
            findParentByUserId: jest.fn(),
            createNounu: jest.fn(),
            createParent: jest.fn(),
            updateNounu: jest.fn(),
            updateParent: jest.fn(),
            findNounuById: jest.fn(),
            findParentById: jest.fn(),
            findAllNounus: jest.fn(),
            findAllParents: jest.fn(),
            searchNounus: jest.fn(),
            deleteNounu: jest.fn(),
            deleteParent: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            preference: { create: jest.fn() },
            parameter: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
            media: { create: jest.fn(), updateMany: jest.fn() },
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(CreateNounuProfileUseCase);
    userRepo = moduleRef.get('IUserRepository') as jest.Mocked<IUserRepository>;
    profileRepo = moduleRef.get('IProfileRepository') as jest.Mocked<IProfileRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const userId = 'user-1';
  const validData = {
    fullname: 'Awa Nounu',
    age: '28',
    phone: '+2250700000000',
    anneesExperience: '5',
    tarifHoraire: '2000',
    tarifMensuel: '60000',
  };

  describe('execute', () => {
    it('should create a nounu profile successfully', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'awa-nounu',
        email: 'awa@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findNounuByUserId.mockResolvedValue(null);
      profileRepo.createNounu.mockResolvedValue({
        id: 'nounu-1',
        ...validData,
        userId,
        status: 'disponible',
        certif: 'Pending',
        points: 0,
        flexibiliteTarifaire: false,
        urgences: false,
        evaluationPrecedentes: '',
        references: '',
        courteBiographie: '',
      } as any);
      profileRepo.findNounuById.mockResolvedValue({
        id: 'nounu-1',
        ...validData,
        userId,
      } as any);

      const result = await useCase.execute(userId, validData);

      expect(userRepo.findById).toHaveBeenCalledWith(userId);
      expect(profileRepo.findNounuByUserId).toHaveBeenCalledWith(userId);
      expect(profileRepo.createNounu).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validData,
          userId,
          status: 'disponible',
          certif: 'Pending',
          points: 0,
          flexibiliteTarifaire: false,
          urgences: false,
        }),
      );
      expect(result.id).toBe('nounu-1');
      expect(result.fullname).toBe(validData.fullname);
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(userId, validData)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, validData)).rejects.toThrow('Utilisateur introuvable');
      expect(profileRepo.createNounu).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if nounu profile already exists', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'awa-nounu',
        email: 'awa@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findNounuByUserId.mockResolvedValue({
        id: 'existing-nounu',
        userId,
        fullname: 'Existing Nounu',
      } as any);

      await expect(useCase.execute(userId, validData)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, validData)).rejects.toThrow('Profil nounou déjà existant');
      expect(profileRepo.createNounu).not.toHaveBeenCalled();
    });

    it('should set default status to disponible when not provided', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'awa-nounu',
        email: 'awa@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findNounuByUserId.mockResolvedValue(null);
      profileRepo.createNounu.mockResolvedValue({ id: 'nounu-1' } as any);

      await useCase.execute(userId, validData);

      const createCall = profileRepo.createNounu.mock.calls[0][0];
      expect(createCall.status).toBe('disponible');
    });

    it('should set default certif to Pending when not provided', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'awa-nounu',
        email: 'awa@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findNounuByUserId.mockResolvedValue(null);
      profileRepo.createNounu.mockResolvedValue({ id: 'nounu-1' } as any);

      await useCase.execute(userId, validData);

      const createCall = profileRepo.createNounu.mock.calls[0][0];
      expect(createCall.certif).toBe('Pending');
    });

    it('should set default values for optional fields', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'awa-nounu',
        email: 'awa@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findNounuByUserId.mockResolvedValue(null);
      profileRepo.createNounu.mockResolvedValue({ id: 'nounu-1' } as any);

      await useCase.execute(userId, validData);

      const createCall = profileRepo.createNounu.mock.calls[0][0];
      expect(createCall.evaluationPrecedentes).toBe('');
      expect(createCall.references).toBe('');
      expect(createCall.courteBiographie).toBe('');
      expect(createCall.points).toBe(0);
      expect(createCall.flexibiliteTarifaire).toBe(false);
      expect(createCall.urgences).toBe(false);
    });

    it('should use provided optional fields when given', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'awa-nounu',
        email: 'awa@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findNounuByUserId.mockResolvedValue(null);
      profileRepo.createNounu.mockResolvedValue({ id: 'nounu-1' } as any);

      const dataWithOptionals = {
        ...validData,
        evaluationPrecedentes: '5/5',
        references: 'Ref A, Ref B',
        courteBiographie: 'Nounou expérimentée',
        status: 'indisponible',
        certif: 'Approved',
      };

      await useCase.execute(userId, dataWithOptionals);

      const createCall = profileRepo.createNounu.mock.calls[0][0];
      expect(createCall.evaluationPrecedentes).toBe('5/5');
      expect(createCall.references).toBe('Ref A, Ref B');
      expect(createCall.courteBiographie).toBe('Nounou expérimentée');
      expect(createCall.status).toBe('indisponible');
      expect(createCall.certif).toBe('Approved');
    });
  });
});
