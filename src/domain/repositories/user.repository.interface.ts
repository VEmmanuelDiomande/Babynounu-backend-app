// Repository interfaces (ports) — contracts that infrastructure must implement

import { UserEntity, UserProfile } from '../entities';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findBySlug(slug: string): Promise<UserEntity | null>;
  create(data: { slug: string; email: string; password: string; roleId?: number; typeProfilId?: number }): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  getProfile(id: string): Promise<UserProfile | null>;
  findParameterBySlug(slug: string): Promise<{ id: number; slug: string; name: string } | null>;
}

export interface IProfileRepository {
  findParentByUserId(userId: string): Promise<any | null>;
  findNounuByUserId(userId: string): Promise<any | null>;
  createParent(data: any): Promise<any>;
  updateParent(id: string, data: any): Promise<any>;
  createNounu(data: any): Promise<any>;
  updateNounu(id: string, data: any): Promise<any>;
  findNounuById(id: string): Promise<any | null>;
  findParentById(id: string): Promise<any | null>;
  findAllNounus(filters: any, skip: number, limit: number): Promise<{ data: any[]; total: number }>;
  findAllParents(filters: any, skip: number, limit: number): Promise<{ data: any[]; total: number }>;
  searchNounus(data: any, skip: number, limit: number): Promise<{ data: any[]; total: number }>;
  deleteNounu(id: string): Promise<void>;
  deleteParent(id: string): Promise<void>;
}
