// Domain entity interfaces — pure business types, no technical dependencies

export interface UserEntity {
  id: string;
  slug: string;
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
  roleId?: number;
  typeProfilId?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  slug: string;
  role?: { id: number; slug: string; name: string };
  typeProfil?: { id: number; slug: string; name: string };
  medias?: MediaEntity[];
  parent?: ParentProfileEntity[];
  nounu?: NounuProfileEntity[];
  abonnements?: SubscriptionEntity[];
}

export interface ParentProfileEntity {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  numberOfChildren: string;
  budgetEstimated: string;
  informationsComplementaires?: string;
  userId: string;
}

export interface NounuProfileEntity {
  id: string;
  fullname: string;
  age: string;
  phone: string;
  anneesExperience: string;
  tarifHoraire: string;
  tarifMensuel: string;
  status: string;
  points: number;
  flexibiliteTarifaire: boolean;
  urgences: boolean;
  certif: 'Approved' | 'Pending' | 'Rejected';
  evaluationPrecedentes: string;
  references: string;
  courteBiographie: string;
  userId: string;
}

export interface MediaEntity {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  originalUrl?: string;
  userId?: string;
  jobId?: number;
  typeMediaId?: number;
}

export interface SubscriptionEntity {
  id: string;
  status: string;
  expiresAt?: Date;
  userId: string;
  typeId?: number;
}

export interface JobEntity {
  id: number;
  titre: string;
  description: string;
  moyensDeContact: string;
  combinaisonService: boolean;
  inclusWeekend: boolean;
  nombreEnfants?: string;
  experienceMinimun: boolean;
  anneeExperience?: string;
  tarifPropose?: string;
  negociable: boolean;
  dateDebut: string;
  missionUrgente: boolean;
  descriptionComplementaire: string;
  userId: string;
}

export interface RoomEntity {
  id: number;
  senderId: string;
  receiverId: string;
  nounuId?: string;
  parentId?: string;
}

export interface MessageEntity {
  id: number;
  content: string;
  isRead: boolean;
  type: 'Message' | 'Proposition';
  isProposition: boolean;
  propositionExpired?: string;
  proposalStatus: 'Accepted' | 'Refused' | 'Pending';
  senderId: string;
  roomId: number;
}

export interface NotificationEntity {
  id: number;
  type: string;
  message: string;
  tolinkId?: string;
  isRead: boolean;
  isActions: boolean;
  isDeleted: boolean;
  userId: string;
  senderId?: string;
  jobId?: number;
}

export interface PaymentEntity {
  id: string;
  transactionId?: string;
  operatorId?: string;
  paymentDate?: Date;
  amount: number;
  currency?: string;
  status?: string;
  paymentToken?: string;
  paymentType?: string;
  paymentMethod?: string;
  userId: string;
}

export interface ContractEntity {
  id: number;
  status: 'Accepted' | 'Pending' | 'Canceled';
  roomId: number;
  messageId?: number;
}
