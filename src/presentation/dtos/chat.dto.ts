import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  isProposition?: boolean;

  @IsString()
  @IsOptional()
  propositionExpired?: string;

  @IsString()
  @IsOptional()
  proposalStatus?: string;

  @IsNumber()
  @IsOptional()
  montant?: number;

  @IsString()
  @IsOptional()
  periode?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  attachmentName?: string;

  @IsString()
  @IsOptional()
  attachmentType?: string;
}

export class CreateRoomDto {
  @IsString()
  receiverId: string;

  @IsString()
  @IsOptional()
  nounuId?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
