import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateParentProfileDto {
  @IsString()
  @IsOptional()
  fullname?: string;

  @IsString()
  phone: string;

  @IsString()
  numberOfChildren: string;

  @IsString()
  budgetEstimated: string;

  @IsString()
  @IsOptional()
  informationsComplementaires?: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullname?: string;

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

export class CreateNounuProfileDto {
  @IsString()
  fullname: string;

  @IsString()
  age: string;

  @IsString()
  phone: string;

  @IsString()
  anneesExperience: string;

  @IsString()
  tarifHoraire: string;

  @IsString()
  tarifMensuel: string;

  @IsString()
  @IsOptional()
  evaluationPrecedentes?: string;

  @IsString()
  @IsOptional()
  references?: string;

  @IsString()
  @IsOptional()
  courteBiographie?: string;

  @IsString()
  @IsOptional()
  status?: 'disponible' | 'indisponible';

  @IsString()
  @IsOptional()
  certif?: 'Approved' | 'Pending' | 'Rejected';
}

export class UpdateNounuProfileDto {
  @IsString()
  @IsOptional()
  fullname?: string;

  @IsString()
  @IsOptional()
  age?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  anneesExperience?: string;

  @IsString()
  @IsOptional()
  tarifHoraire?: string;

  @IsString()
  @IsOptional()
  tarifMensuel?: string;

  @IsString()
  @IsOptional()
  evaluationPrecedentes?: string;

  @IsString()
  @IsOptional()
  references?: string;

  @IsString()
  @IsOptional()
  courteBiographie?: string;

  @IsString()
  @IsOptional()
  status?: 'disponible' | 'indisponible';

  @IsString()
  @IsOptional()
  certif?: 'Approved' | 'Pending' | 'Rejected';

  @IsString()
  @IsOptional()
  flexibiliteTarifaire?: boolean;

  @IsString()
  @IsOptional()
  urgences?: boolean;
}
