import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceService } from '@/services/finance.service';
import type { HttpClientInterface, FinanceConfig } from '@/types';

// Mock utils
vi.mock('@/utils', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe('FinanceService', () => {
  let mockHttpClient: HttpClientInterface;
  let mockConfig: FinanceConfig;
  let financeService: FinanceService;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    mockConfig = {
      baseUrl: 'https://api.finance.example.com',
      apiKey: 'test-api-key',
      dispersionEndpoint: '/dispersion',
      timeout: 30000,
    };

    financeService = new FinanceService(mockHttpClient, mockConfig);
  });

  describe('sendDispersionData', () => {
    it('should send dispersion data successfully', async () => {
      const dispersionData = {
        fileName: 'test-file.csv',
        fileSize: 1024,
        uploadTime: '2023-01-01T00:00:00Z',
        metadata: { source: 'test' },
      };

      const expectedResponse = {
        success: true,
        data: { id: '123' },
        message: 'Data received successfully',
      };

      mockHttpClient.post = vi.fn().mockResolvedValue(expectedResponse);

      const result = await financeService.sendDispersionData(dispersionData);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.finance.example.com/dispersion',
        dispersionData,
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      expect(result).toEqual(expectedResponse);
    });

    it('should handle API errors gracefully', async () => {
      const dispersionData = {
        fileName: 'test-file.csv',
        fileSize: 1024,
        uploadTime: '2023-01-01T00:00:00Z',
      };

      const error = new Error('API Error');
      mockHttpClient.post = vi.fn().mockRejectedValue(error);

      const result = await financeService.sendDispersionData(dispersionData);

      expect(result).toEqual({
        success: false,
        error: 'API Error',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const dispersionData = {
        fileName: 'test-file.csv',
        fileSize: 1024,
        uploadTime: '2023-01-01T00:00:00Z',
      };

      mockHttpClient.post = vi.fn().mockRejectedValue('String error');

      const result = await financeService.sendDispersionData(dispersionData);

      expect(result).toEqual({
        success: false,
        error: 'String error',
      });
    });
  });

  describe('validateFinanceFile', () => {
    it('should validate CSV file successfully', () => {
      const result = financeService.validateFinanceFile('test-file.csv', 1024 * 1024);

      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });

    it('should validate XLSX file successfully', () => {
      const result = financeService.validateFinanceFile('test-file.xlsx', 1024 * 1024);

      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });

    it('should validate TXT file successfully', () => {
      const result = financeService.validateFinanceFile('test-file.txt', 1024 * 1024);

      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });

    it('should reject invalid file extension', () => {
      const result = financeService.validateFinanceFile('test-file.pdf', 1024 * 1024);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid file extension: .pdf. Allowed: .csv, .xlsx, .txt');
    });

    it('should reject file that is too large', () => {
      const fileSizeOver50MB = 51 * 1024 * 1024; // 51MB
      const result = financeService.validateFinanceFile('test-file.csv', fileSizeOver50MB);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds maximum allowed size of 50MB');
    });

    it('should reject file that is too small', () => {
      const fileSizeUnder1KB = 512; // 512 bytes
      const result = financeService.validateFinanceFile('test-file.csv', fileSizeUnder1KB);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size is too small (minimum 1KB required)');
    });

    it('should handle multiple validation errors', () => {
      const fileSizeOver50MB = 51 * 1024 * 1024; // 51MB
      const result = financeService.validateFinanceFile('test-file.pdf', fileSizeOver50MB);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Invalid file extension: .pdf. Allowed: .csv, .xlsx, .txt');
      expect(result.errors).toContain('File size exceeds maximum allowed size of 50MB');
    });

    it('should handle uppercase file extensions', () => {
      const result = financeService.validateFinanceFile('test-file.CSV', 1024 * 1024);

      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });

    it('should handle files without extension', () => {
      const result = financeService.validateFinanceFile('test-file', 1024 * 1024);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid file extension: test-file. Allowed: .csv, .xlsx, .txt');
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when API responds', async () => {
      mockHttpClient.get = vi.fn().mockResolvedValue({ status: 'ok' });

      const result = await financeService.getHealthStatus();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://api.finance.example.com/health',
        {
          headers: {
            'X-API-Key': 'test-api-key',
          },
          timeout: 5000,
        }
      );

      expect(result.healthy).toBe(true);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when API fails', async () => {
      const error = new Error('Connection failed');
      mockHttpClient.get = vi.fn().mockRejectedValue(error);

      const result = await financeService.getHealthStatus();

      expect(result.healthy).toBe(false);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should measure response time correctly', async () => {
      // Mock Date.now to control timing
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = vi.fn(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1100; // 100ms difference
      });

      mockHttpClient.get = vi.fn().mockResolvedValue({ status: 'ok' });

      const result = await financeService.getHealthStatus();

      expect(result.responseTime).toBe(100);

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });
});