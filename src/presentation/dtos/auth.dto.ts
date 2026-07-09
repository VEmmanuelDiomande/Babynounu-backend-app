import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn(['parent', 'nounu', 'prestataire', 'admin'])
  type_profil: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
