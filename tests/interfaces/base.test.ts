import { describe, it, expect } from 'vitest';
import type {
  BaseEntity,
  BaseService,
  BaseRepository,
  ValidationResult,
  FieldValidationError,
  PaginationOptions,
  PaginatedResult,
} from '@/interfaces/base';

describe('Base Interfaces', () => {
  describe('BaseEntity', () => {
    it('should define correct structure for BaseEntity', () => {
      const entity: BaseEntity = {
        id: 'test-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(entity.id).toBe('test-id');
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('BaseService', () => {
    it('should define correct structure for BaseService', () => {
      const service: BaseService = {
        initialize: async () => {},
        cleanup: async () => {},
      };

      expect(typeof service.initialize).toBe('function');
      expect(typeof service.cleanup).toBe('function');
    });
  });

  describe('BaseRepository', () => {
    it('should define correct structure for BaseRepository', () => {
      const repository: BaseRepository<BaseEntity> = {
        findById: async (id: string) => null,
        findAll: async (options?: { limit?: number; offset?: number }) => [],
        create: async (entity: Omit<BaseEntity, 'id' | 'createdAt' | 'updatedAt'>) => ({
          id: 'new-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...entity,
        }),
        update: async (id: string, updates: Partial<Omit<BaseEntity, 'id' | 'createdAt' | 'updatedAt'>>) => null,
        delete: async (id: string) => false,
      };

      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.findAll).toBe('function');
      expect(typeof repository.create).toBe('function');
      expect(typeof repository.update).toBe('function');
      expect(typeof repository.delete).toBe('function');
    });
  });

  describe('ValidationResult', () => {
    it('should define correct structure for ValidationResult', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: [],
      };

      const invalidResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'email',
            message: 'Invalid email format',
            code: 'INVALID_EMAIL',
          },
        ],
      };

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual([]);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
    });
  });

  describe('FieldValidationError', () => {
    it('should define correct structure for FieldValidationError', () => {
      const error: FieldValidationError = {
        field: 'username',
        message: 'Username is required',
        code: 'REQUIRED_FIELD',
      };

      expect(error.field).toBe('username');
      expect(error.message).toBe('Username is required');
      expect(error.code).toBe('REQUIRED_FIELD');
    });
  });

  describe('PaginationOptions', () => {
    it('should define correct structure for PaginationOptions', () => {
      const options: PaginationOptions = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      expect(options.page).toBe(1);
      expect(options.limit).toBe(10);
      expect(options.sortBy).toBe('createdAt');
      expect(options.sortOrder).toBe('desc');
    });

    it('should work with minimal options', () => {
      const options: PaginationOptions = {
        page: 1,
        limit: 20,
      };

      expect(options.page).toBe(1);
      expect(options.limit).toBe(20);
      expect(options.sortBy).toBeUndefined();
      expect(options.sortOrder).toBeUndefined();
    });
  });

  describe('PaginatedResult', () => {
    it('should define correct structure for PaginatedResult', () => {
      const result: PaginatedResult<BaseEntity> = {
        data: [
          {
            id: 'entity-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });
});
