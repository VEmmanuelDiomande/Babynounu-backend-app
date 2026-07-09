import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateJobDto {
  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsString()
  moyensDeContact: string;

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
  dateDebut: string;

  @IsBoolean()
  @IsOptional()
  missionUrgente?: boolean;

  @IsString()
  descriptionComplementaire: string;
}

export class UpdateJobDto extends CreateJobDto {}
