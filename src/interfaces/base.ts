/**
 * @fileoverview Base Interfaces
 * 
 * This file contains base interfaces and common patterns
 * that are used throughout the application.
 */

// Base Entity Interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Base Service Interface
export interface BaseService {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

// Base Repository Interface
export interface BaseRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(options?: { limit?: number; offset?: number }): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Validation Interface
export interface ValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
}

export interface FieldValidationError {
  field: string;
  message: string;
  code: string;
}

// Pagination Interface
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}