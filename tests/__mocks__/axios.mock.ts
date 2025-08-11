/**
 * @fileoverview Axios Mock Configuration
 * 
 * Centralized mock configuration for Axios HTTP client.
 * This mock provides consistent behavior across all tests
 * that use HTTP client functionality.
 */

import { vi } from 'vitest';

// Mock Axios instance
export const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  request: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      delete: {},
      patch: {},
    },
    timeout: 5000,
  },
};

// Mock Axios create function
export const mockAxiosCreate = vi.fn(() => mockAxiosInstance);

// Default Axios mock
export const axiosMock = {
  default: {
    create: mockAxiosCreate,
    ...mockAxiosInstance,
  },
  create: mockAxiosCreate,
  ...mockAxiosInstance,
};

/**
 * Reset all Axios mocks to their initial state
 */
export const resetAxiosMocks = () => {
  vi.clearAllMocks();
  mockAxiosCreate.mockReturnValue(mockAxiosInstance);
};

/**
 * Setup successful HTTP response mock
 */
export const mockSuccessResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

/**
 * Setup error response mock
 */
export const mockErrorResponse = (message: string, status = 500) => ({
  response: {
    data: { message },
    status,
    statusText: 'Internal Server Error',
    headers: {},
    config: {},
  },
  message,
  name: 'AxiosError',
  isAxiosError: true,
});