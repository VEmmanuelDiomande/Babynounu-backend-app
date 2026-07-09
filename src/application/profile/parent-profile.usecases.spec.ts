import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateParentProfileUseCase, UpdateParentProfileUseCase, GetMyParentProfileUseCase, GetParentByIdUseCase, DeleteParentUseCase } from './profile.usecases';
import { IUserRepository, IProfileRepository } from '../../domain';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('CreateParentProfileUseCase', () => {
  let useCase: CreateParentProfileUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let profileRepo: jest.Mocked<IProfileRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateParentProfileUseCase,
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
            preference: { create: jest.fn(), deleteMany: jest.fn() },
            parameter: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
            media: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(CreateParentProfileUseCase);
    userRepo = moduleRef.get('IUserRepository') as jest.Mocked<IUserRepository>;
    profileRepo = moduleRef.get('IProfileRepository') as jest.Mocked<IProfileRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const userId = 'user-parent-1';
  const validData = {
    fullname: 'Koffi Parent',
    email: 'koffi@test.com',
    phone: '+2250700000001',
    numberOfChildren: '2',
    budgetEstimated: '50000',
  };

  describe('execute', () => {
    it('should create a parent profile successfully', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'koffi-parent',
        email: 'koffi@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findParentByUserId.mockResolvedValue(null);
      profileRepo.createParent.mockResolvedValue({
        id: 'parent-1',
        ...validData,
        userId,
      } as any);
      profileRepo.findParentById.mockResolvedValue({
        id: 'parent-1',
        ...validData,
        userId,
      } as any);

      const result = await useCase.execute(userId, validData);

      expect(userRepo.findById).toHaveBeenCalledWith(userId);
      expect(profileRepo.findParentByUserId).toHaveBeenCalledWith(userId);
      expect(profileRepo.createParent).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validData,
          userId,
        }),
      );
      expect(result.id).toBe('parent-1');
      expect(result.fullname).toBe(validData.fullname);
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(userId, validData)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, validData)).rejects.toThrow('Utilisateur introuvable');
      expect(profileRepo.createParent).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if parent profile already exists', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'koffi-parent',
        email: 'koffi@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findParentByUserId.mockResolvedValue({
        id: 'existing-parent',
        userId,
        fullname: 'Existing Parent',
      } as any);

      await expect(useCase.execute(userId, validData)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, validData)).rejects.toThrow('Profil parent déjà existant');
      expect(profileRepo.createParent).not.toHaveBeenCalled();
    });

    it('should pass optional fields when provided', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'koffi-parent',
        email: 'koffi@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findParentByUserId.mockResolvedValue(null);
      profileRepo.createParent.mockResolvedValue({ id: 'parent-1' } as any);
      profileRepo.findParentById.mockResolvedValue({ id: 'parent-1' } as any);

      const dataWithOptional = {
        ...validData,
        informationsComplementaires: 'Besoin d\'une nounou pour le soir',
      };

      await useCase.execute(userId, dataWithOptional);

      const createCall = profileRepo.createParent.mock.calls[0][0];
      expect(createCall.informationsComplementaires).toBe('Besoin d\'une nounou pour le soir');
    });

    it('should pass data without optional fields when not provided', async () => {
      userRepo.findById.mockResolvedValue({
        id: userId,
        slug: 'koffi-parent',
        email: 'koffi@test.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      profileRepo.findParentByUserId.mockResolvedValue(null);
      profileRepo.createParent.mockResolvedValue({ id: 'parent-1' } as any);
      profileRepo.findParentById.mockResolvedValue({ id: 'parent-1' } as any);

      await useCase.execute(userId, validData);

      const createCall = profileRepo.createParent.mock.calls[0][0];
      expect(createCall.userId).toBe(userId);
      expect(createCall.fullname).toBe(validData.fullname);
      expect(createCall.email).toBe(validData.email);
    });
  });
});

describe('UpdateParentProfileUseCase', () => {
  let useCase: UpdateParentProfileUseCase;
  let profileRepo: jest.Mocked<IProfileRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdateParentProfileUseCase,
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
            preference: { create: jest.fn(), deleteMany: jest.fn() },
            parameter: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
            media: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(UpdateParentProfileUseCase);
    profileRepo = moduleRef.get('IProfileRepository') as jest.Mocked<IProfileRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update parent profile by userId', async () => {
    profileRepo.findParentByUserId.mockResolvedValue({ id: 'parent-1', userId: 'user-1' } as any);
    profileRepo.updateParent.mockResolvedValue({ id: 'parent-1', fullname: 'Updated' } as any);
    profileRepo.findParentById.mockResolvedValue({ id: 'parent-1', fullname: 'Updated' } as any);

    const result = await useCase.execute('user-1', { fullname: 'Updated' });

    expect(profileRepo.findParentByUserId).toHaveBeenCalledWith('user-1');
    expect(profileRepo.updateParent).toHaveBeenCalledWith('parent-1', { fullname: 'Updated' });
    expect(result.fullname).toBe('Updated');
  });

  it('should throw NotFoundException if parent profile not found', async () => {
    profileRepo.findParentByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1', {})).rejects.toThrow(NotFoundException);
    await expect(useCase.execute('user-1', {})).rejects.toThrow('Profil parent introuvable');
  });
});

describe('GetMyParentProfileUseCase', () => {
  let useCase: GetMyParentProfileUseCase;
  let profileRepo: jest.Mocked<IProfileRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetMyParentProfileUseCase,
        {
          provide: 'IProfileRepository',
          useValue: {
            findParentByUserId: jest.fn(),
            findNounuByUserId: jest.fn(),
            findParentById: jest.fn(),
            findNounuById: jest.fn(),
            createParent: jest.fn(),
            createNounu: jest.fn(),
            updateParent: jest.fn(),
            updateNounu: jest.fn(),
            findAllNounus: jest.fn(),
            findAllParents: jest.fn(),
            searchNounus: jest.fn(),
            deleteNounu: jest.fn(),
            deleteParent: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetMyParentProfileUseCase);
    profileRepo = moduleRef.get('IProfileRepository') as jest.Mocked<IProfileRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return parent profile for user', async () => {
    profileRepo.findParentByUserId.mockResolvedValue({ id: 'parent-1', fullname: 'Koffi' } as any);

    const result = await useCase.execute('user-1');

    expect(profileRepo.findParentByUserId).toHaveBeenCalledWith('user-1');
    expect(result.id).toBe('parent-1');
  });

  it('should throw NotFoundException if parent profile not found', async () => {
    profileRepo.findParentByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1')).rejects.toThrow(NotFoundException);
    await expect(useCase.execute('user-1')).rejects.toThrow('Profil parent introuvable');
  });
});

describe('DeleteParentUseCase', () => {
  let useCase: DeleteParentUseCase;
  let profileRepo: jest.Mocked<IProfileRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DeleteParentUseCase,
        {
          provide: 'IProfileRepository',
          useValue: {
            findParentById: jest.fn(),
            findNounuByUserId: jest.fn(),
            findParentByUserId: jest.fn(),
            findNounuById: jest.fn(),
            createParent: jest.fn(),
            createNounu: jest.fn(),
            updateParent: jest.fn(),
            updateNounu: jest.fn(),
            findAllNounus: jest.fn(),
            findAllParents: jest.fn(),
            searchNounus: jest.fn(),
            deleteNounu: jest.fn(),
            deleteParent: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = moduleRef.get(DeleteParentUseCase);
    profileRepo = moduleRef.get('IProfileRepository') as jest.Mocked<IProfileRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete parent profile successfully', async () => {
    profileRepo.findParentById.mockResolvedValue({ id: 'parent-1' } as any);
    profileRepo.deleteParent.mockResolvedValue(undefined);

    await useCase.execute('parent-1');

    expect(profileRepo.findParentById).toHaveBeenCalledWith('parent-1');
    expect(profileRepo.deleteParent).toHaveBeenCalledWith('parent-1');
  });

  it('should throw NotFoundException if parent profile not found', async () => {
    profileRepo.findParentById.mockResolvedValue(null);

    await expect(useCase.execute('parent-1')).rejects.toThrow(NotFoundException);
    await expect(useCase.execute('parent-1')).rejects.toThrow('Profil parent introuvable');
  });
});
