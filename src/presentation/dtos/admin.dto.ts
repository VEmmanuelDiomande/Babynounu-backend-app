import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsEmail, MinLength, IsArray, Min } from 'class-validator';

export class CertifyNounuDto {
  @IsString()
  status: 'Approved' | 'Rejected';
}

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  appName?: string;

  @IsString()
  @IsOptional()
  appDescription?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  supportPhone?: string;
}

export class CreateTypeParameterDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;
}

export class UpdateTypeParameterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}

export class CreateParameterDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsInt()
  @IsOptional()
  typeParameterId?: number;
}

export class UpdateParameterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsInt()
  @IsOptional()
  typeParameterId?: number;
}

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  module?: string;
}

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  module?: string;
}

export class AssignPermissionDto {
  @IsInt()
  roleId: number;

  @IsInt()
  permissionId: number;
}

export class CreateJobDto {
  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  moyensDeContact?: string;

  @IsBoolean()
  @IsOptional()
  combinaisonService?: boolean;

  @IsBoolean()
  @IsOptional()
  inclusWeekend?: boolean;

  @IsString()
  @IsOptional()
  nombreEnfants?: string;

  @IsBoolean()
  @IsOptional()
  experienceMinimun?: boolean;

  @IsString()
  @IsOptional()
  anneeExperience?: string;

  @IsString()
  @IsOptional()
  tarifPropose?: string;

  @IsBoolean()
  @IsOptional()
  negociable?: boolean;

  @IsString()
  @IsOptional()
  dateDebut?: string;

  @IsBoolean()
  @IsOptional()
  missionUrgente?: boolean;

  @IsString()
  @IsOptional()
  descriptionComplementaire?: string;

  @IsString()
  userId: string;
}

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  moyensDeContact?: string;

  @IsBoolean()
  @IsOptional()
  combinaisonService?: boolean;

  @IsBoolean()
  @IsOptional()
  inclusWeekend?: boolean;

  @IsString()
  @IsOptional()
  nombreEnfants?: string;

  @IsBoolean()
  @IsOptional()
  experienceMinimun?: boolean;

  @IsString()
  @IsOptional()
  anneeExperience?: string;

  @IsString()
  @IsOptional()
  tarifPropose?: string;

  @IsBoolean()
  @IsOptional()
  negociable?: boolean;

  @IsString()
  @IsOptional()
  dateDebut?: string;

  @IsBoolean()
  @IsOptional()
  missionUrgente?: boolean;

  @IsString()
  @IsOptional()
  descriptionComplementaire?: string;
}

export class SuspendJobDto {
  @IsBoolean()
  suspended: boolean;
}

export class PrioritizeJobDto {
  @IsInt()
  @Min(0)
  priority: number;
}

export class UpdateParentDto {
  @IsString()
  @IsOptional()
  fullname?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  numberOfChildren?: string;

  @IsString()
  @IsOptional()
  budgetEstimated?: string;

  @IsString()
  @IsOptional()
  informationsComplementaires?: string;
}

export class RestrictParentDto {
  @IsBoolean()
  restricted: boolean;
}

export class RestrictNounuDto {
  @IsBoolean()
  restricted: boolean;
}

export class PayNounuDto {
  @IsString()
  nounuId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  operator?: 'mobile_money' | 'wave';
}

export class CreateSubAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsInt()
  roleId: number;

  @IsArray()
  @IsOptional()
  permissionIds?: number[];
}

export class CreatePackDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsInt()
  @IsOptional()
  durationDays?: number;

  @IsOptional()
  features?: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  priority?: number;
}

export class UpdatePackDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsInt()
  @IsOptional()
  durationDays?: number;

  @IsOptional()
  features?: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  priority?: number;
}
