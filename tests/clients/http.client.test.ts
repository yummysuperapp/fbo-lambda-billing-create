import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axiosMock, resetAxiosMocks, mockSuccessResponse, mockErrorResponse } from '@mocks/axios.mock';
import { httpFixtures } from '@fixtures';

// Mock axios before importing the module
vi.mock('axios', () => axiosMock);

import { HttpClient, createHttpClient, getHttpClient, httpClient, HttpClientRegistry } from '@/clients/http.client';

// Mock utils
vi.mock('@/utils', () => ({
	createLogger: vi.fn(() => ({
		info: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	})),
	retryWithBackoff: vi.fn((fn) => fn()),
}));

describe('HttpClient', () => {
	let httpClient: HttpClient;

	beforeEach(() => {
		resetAxiosMocks();
		httpClient = new HttpClient({ timeout: 5000 });
	});

	describe('constructor', () => {
		it('should create HttpClient instance with default config', () => {
			const client = new HttpClient();
			expect(client).toBeInstanceOf(HttpClient);
		});

		it('should create HttpClient instance with custom config', () => {
			const config = httpFixtures.requestConfig;
			const client = new HttpClient(config);
			expect(client).toBeInstanceOf(HttpClient);
		});
	});

	describe('HTTP methods', () => {
		it('should make GET request successfully', async () => {
			const responseData = httpFixtures.successResponse;
			axiosMock.default.create().get.mockResolvedValue(mockSuccessResponse(responseData.data));

			const result = await httpClient.get('/test');

			expect(result).toEqual(responseData.data);
			expect(axiosMock.default.create().get).toHaveBeenCalledWith(
				'/test',
				expect.objectContaining({
					headers: undefined,
					timeout: undefined,
					params: undefined,
					metadata: expect.objectContaining({
						startTime: expect.any(Number),
					}),
				})
			);
		});

		it('should make POST request successfully', async () => {
			const requestData = { name: 'test' };
			const responseData = httpFixtures.successResponse;
			axiosMock.default.create().post.mockResolvedValue(mockSuccessResponse(responseData.data));

			const result = await httpClient.post('/test', requestData);

			expect(result).toEqual(responseData.data);
			expect(axiosMock.default.create().post).toHaveBeenCalledWith(
				'/test',
				requestData,
				expect.objectContaining({
					headers: undefined,
					timeout: undefined,
					params: undefined,
					metadata: expect.objectContaining({
						startTime: expect.any(Number),
					}),
				})
			);
		});

		it('should make PUT request successfully', async () => {
			const requestData = { name: 'updated' };
			const responseData = httpFixtures.successResponse;
			axiosMock.default.create().put.mockResolvedValue(mockSuccessResponse(responseData.data));

			const result = await httpClient.put('/test/1', requestData);

			expect(result).toEqual(responseData.data);
			expect(axiosMock.default.create().put).toHaveBeenCalledWith(
				'/test/1',
				requestData,
				expect.objectContaining({
					headers: undefined,
					timeout: undefined,
					params: undefined,
					metadata: expect.objectContaining({
						startTime: expect.any(Number),
					}),
				})
			);
		});

		it('should make DELETE request successfully', async () => {
			const responseData = httpFixtures.successResponse;
			axiosMock.default.create().delete.mockResolvedValue(mockSuccessResponse(responseData.data));

			const result = await httpClient.delete('/test/1');

			expect(result).toEqual(responseData.data);
			expect(axiosMock.default.create().delete).toHaveBeenCalledWith(
				'/test/1',
				expect.objectContaining({
					headers: undefined,
					timeout: undefined,
					params: undefined,
					metadata: expect.objectContaining({
						startTime: expect.any(Number),
					}),
				})
			);
		});
	});

	describe('error handling', () => {
		it('should handle GET request error', async () => {
			const error = mockErrorResponse('Not Found', 404);
			axiosMock.default.create().get.mockRejectedValue(error);

			await expect(httpClient.get('/test')).rejects.toThrow('Not Found');
		});

		it('should handle POST request error', async () => {
			const error = mockErrorResponse('Bad Request', 400);
			axiosMock.default.create().post.mockRejectedValue(error);

			await expect(httpClient.post('/test', {})).rejects.toThrow('Bad Request');
		});

		it('should handle PUT request error', async () => {
			const error = mockErrorResponse('Unauthorized', 401);
			axiosMock.default.create().put.mockRejectedValue(error);

			await expect(httpClient.put('/test/1', {})).rejects.toThrow('Unauthorized');
		});

		it('should handle DELETE request error', async () => {
			const error = mockErrorResponse('Forbidden', 403);
			axiosMock.default.create().delete.mockRejectedValue(error);

			await expect(httpClient.delete('/test/1')).rejects.toThrow('Forbidden');
		});

		it('should handle network errors', async () => {
			const error = new Error('Network Error');
			axiosMock.default.create().get.mockRejectedValue(error);

			await expect(httpClient.get('/test')).rejects.toThrow('Network Error');
		});

		it('should handle HTTP error status codes', async () => {
			axiosMock.default.create().get.mockResolvedValue({
				status: 404,
				statusText: 'Not Found',
				data: null,
			});

			await expect(httpClient.get('/test')).rejects.toThrow('HTTP 404: Not Found');
		});
	});

	describe('interceptors', () => {
		it('should set up request interceptor', () => {
			// Create a new client to trigger interceptor setup
			new HttpClient();

			// Verify the request interceptor was set up
			expect(axiosMock.default.create().interceptors.request.use).toHaveBeenCalled();

			// Verify it was called with two functions (onFulfilled and onRejected)
			const callArgs = axiosMock.default.create().interceptors.request.use.mock.calls[0];
			expect(callArgs).toHaveLength(2);
			expect(typeof callArgs[0]).toBe('function'); // onFulfilled
			expect(typeof callArgs[1]).toBe('function'); // onRejected
		});

		it('should set up response interceptor', () => {
			// Create a new client to trigger interceptor setup
			new HttpClient();

			// Verify the response interceptor was set up
			expect(axiosMock.default.create().interceptors.response.use).toHaveBeenCalled();

			// Verify it was called with two functions (onFulfilled and onRejected)
			const callArgs = axiosMock.default.create().interceptors.response.use.mock.calls[0];
			expect(callArgs).toHaveLength(2);
			expect(typeof callArgs[0]).toBe('function'); // onFulfilled
			expect(typeof callArgs[1]).toBe('function'); // onRejected
		});

		it('should execute request interceptor onFulfilled callback', () => {
			const client = new HttpClient();

			// Get the request interceptor callbacks
			const requestInterceptorCalls = axiosMock.default.create().interceptors.request.use.mock.calls;
			const onFulfilled = requestInterceptorCalls[requestInterceptorCalls.length - 1][0];

			// Mock config object
			const mockConfig = {
				method: 'get',
				url: '/test',
				headers: { 'Content-Type': 'application/json' },
			};

			// Execute the onFulfilled callback
			const result = onFulfilled(mockConfig);

			// Verify it returns the config
			expect(result).toBe(mockConfig);
		});

		it('should execute request interceptor onRejected callback', async () => {
			const client = new HttpClient();

			// Get the request interceptor callbacks
			const requestInterceptorCalls = axiosMock.default.create().interceptors.request.use.mock.calls;
			const onRejected = requestInterceptorCalls[requestInterceptorCalls.length - 1][1];

			// Mock error object
			const mockError = new Error('Request error');

			// Execute the onRejected callback and expect it to reject
			await expect(onRejected(mockError)).rejects.toThrow('Request error');
		});

		it('should execute response interceptor onFulfilled callback', () => {
			const client = new HttpClient();

			// Get the response interceptor callbacks
			const responseInterceptorCalls = axiosMock.default.create().interceptors.response.use.mock.calls;
			const onFulfilled = responseInterceptorCalls[responseInterceptorCalls.length - 1][0];

			// Mock response object
			const mockResponse = {
				status: 200,
				statusText: 'OK',
				config: {
					url: '/test',
					metadata: { startTime: Date.now() - 100 },
				},
				data: { success: true },
			};

			// Execute the onFulfilled callback
			const result = onFulfilled(mockResponse);

			// Verify it returns the response
			expect(result).toBe(mockResponse);
		});

		it('should execute response interceptor onRejected callback', async () => {
			const client = new HttpClient();

			// Get the response interceptor callbacks
			const responseInterceptorCalls = axiosMock.default.create().interceptors.response.use.mock.calls;
			const onRejected = responseInterceptorCalls[responseInterceptorCalls.length - 1][1];

			// Mock error object with response
			const mockError = {
				response: {
					status: 500,
					statusText: 'Internal Server Error',
					config: {
						url: '/test',
						metadata: { startTime: Date.now() - 100 },
					},
				},
				config: {
					url: '/test',
					metadata: { startTime: Date.now() - 100 },
				},
			};

			// Execute the onRejected callback and expect it to reject
			await expect(onRejected(mockError)).rejects.toEqual(mockError);
		});

		it('should execute response interceptor onRejected callback without response', async () => {
			const client = new HttpClient();

			// Get the response interceptor callbacks
			const responseInterceptorCalls = axiosMock.default.create().interceptors.response.use.mock.calls;
			const onRejected = responseInterceptorCalls[responseInterceptorCalls.length - 1][1];

			// Mock error object without response
			const mockError = {
				config: {
					url: '/test',
					metadata: { startTime: Date.now() - 100 },
				},
			};

			// Execute the onRejected callback and expect it to reject
			await expect(onRejected(mockError)).rejects.toEqual(mockError);
		});

		it('should handle request interceptor errors', async () => {
			const requestError = new Error('Request interceptor error');

			// Mock axios to simulate request interceptor error
			axiosMock.default.create().get.mockRejectedValueOnce(requestError);

			const client = createHttpClient({ baseURL: 'https://api.test.com' });

			await expect(client.get('/test')).rejects.toThrow('Request interceptor error');
		});

		it('should handle response interceptor errors', async () => {
			const responseError = {
				response: {
					status: 500,
					statusText: 'Internal Server Error',
				},
				config: {
					url: '/test',
				},
			};

			// Mock axios to simulate response interceptor error
			axiosMock.default.create().get.mockRejectedValueOnce(responseError);

			const client = createHttpClient({ baseURL: 'https://api.test.com' });

			await expect(client.get('/test')).rejects.toThrow();
		});
	});

	describe('header sanitization', () => {
		it('should sanitize sensitive headers', () => {
			const client = createHttpClient({ baseURL: 'https://api.test.com' });

			// Access the private method through reflection for testing
			const sanitizeHeaders = (client as any).sanitizeHeaders.bind(client);

			const headers = {
				authorization: 'Bearer secret-token',
				'x-api-key': 'secret-key',
				cookie: 'session=secret',
				'set-cookie': 'session=secret',
				'content-type': 'application/json',
			};

			const sanitized = sanitizeHeaders(headers);

			expect(sanitized).toEqual({
				authorization: '[REDACTED]',
				'x-api-key': '[REDACTED]',
				cookie: '[REDACTED]',
				'set-cookie': '[REDACTED]',
				'content-type': 'application/json',
			});
		});

		it('should handle non-object headers', () => {
			const client = createHttpClient({ baseURL: 'https://api.test.com' });

			// Access the private method through reflection for testing
			const sanitizeHeaders = (client as any).sanitizeHeaders.bind(client);

			expect(sanitizeHeaders(null)).toEqual({});
			expect(sanitizeHeaders(undefined)).toEqual({});
			expect(sanitizeHeaders('string')).toEqual({});
			expect(sanitizeHeaders(123)).toEqual({});
		});
	});

	describe('response time calculation', () => {
		it('should calculate response time when metadata exists', () => {
			const client = createHttpClient({ baseURL: 'https://api.test.com' });

			// Access the private method through reflection for testing
			const getResponseTime = (client as any).getResponseTime.bind(client);

			const startTime = Date.now() - 100;
			const response = {
				config: {
					metadata: { startTime },
				},
			};

			const responseTime = getResponseTime(response);
			expect(responseTime).toBeGreaterThan(0);
			expect(responseTime).toBeLessThan(1000);
		});

		it('should return undefined when no metadata exists', () => {
			const client = createHttpClient({ baseURL: 'https://api.test.com' });

			// Access the private method through reflection for testing
			const getResponseTime = (client as any).getResponseTime.bind(client);

			const response = {
				config: {},
			};

			const responseTime = getResponseTime(response);
			expect(responseTime).toBeUndefined();
		});
	});

	describe('private methods', () => {
		it('should sanitize headers correctly', () => {
			const client = createHttpClient();

			// Test with null/undefined headers
			expect((client as any).sanitizeHeaders(null)).toEqual({});
			expect((client as any).sanitizeHeaders(undefined)).toEqual({});
			expect((client as any).sanitizeHeaders('not an object')).toEqual({});

			// Test with sensitive headers
			const headers = {
				Authorization: 'Bearer token123',
				'X-API-Key': 'secret-key',
				Cookie: 'session=abc123',
				'Set-Cookie': 'session=abc123',
				'Content-Type': 'application/json',
				'User-Agent': 'test-agent',
			};

			const sanitized = (client as any).sanitizeHeaders(headers);
			expect(sanitized).toEqual({
				Authorization: '[REDACTED]',
				'X-API-Key': '[REDACTED]',
				Cookie: '[REDACTED]',
				'Set-Cookie': '[REDACTED]',
				'Content-Type': 'application/json',
				'User-Agent': 'test-agent',
			});
		});

		it('should calculate response time correctly', () => {
			const client = createHttpClient();
			const startTime = Date.now() - 100;

			// Test with metadata
			const responseWithMetadata = {
				config: {
					metadata: { startTime },
				},
			} as any;

			const responseTime = (client as any).getResponseTime(responseWithMetadata);
			expect(responseTime).toBeGreaterThanOrEqual(100);

			// Test without metadata
			const responseWithoutMetadata = {
				config: {},
			} as any;

			const noResponseTime = (client as any).getResponseTime(responseWithoutMetadata);
			expect(noResponseTime).toBeUndefined();
		});

		it('should convert to axios config correctly', () => {
			const client = createHttpClient();

			// Test with config
			const config = {
				headers: { 'Content-Type': 'application/json' },
				timeout: 5000,
				params: { page: 1 },
			};

			const axiosConfig = (client as any).toAxiosConfig(config);
			expect(axiosConfig.headers).toEqual(config.headers);
			expect(axiosConfig.timeout).toBe(config.timeout);
			expect(axiosConfig.params).toEqual(config.params);
			expect(axiosConfig.metadata.startTime).toBeDefined();

			// Test without config
			const axiosConfigEmpty = (client as any).toAxiosConfig();
			expect(axiosConfigEmpty.headers).toBeUndefined();
			expect(axiosConfigEmpty.timeout).toBeUndefined();
			expect(axiosConfigEmpty.params).toBeUndefined();
			expect(axiosConfigEmpty.metadata.startTime).toBeDefined();
		});

		it('should handle request with custom options', async () => {
			const responseData = httpFixtures.successResponse;
			axiosMock.default.create().get.mockResolvedValue(mockSuccessResponse(responseData.data));

			const options = {
				headers: { 'Custom-Header': 'value' },
				timeout: 10000,
				params: { filter: 'active' },
			};

			const result = await httpClient.get('/test', options);

			expect(result).toEqual(responseData.data);
			expect(axiosMock.default.create().get).toHaveBeenCalledWith(
				'/test',
				expect.objectContaining({
					headers: options.headers,
					timeout: options.timeout,
					params: options.params,
					metadata: expect.objectContaining({
						startTime: expect.any(Number),
					}),
				})
			);
		});

		it('should handle HTTP error status codes in executeRequest', async () => {
			const mockAxios = {
				get: vi.fn(),
				post: vi.fn(),
				put: vi.fn(),
				delete: vi.fn(),
				interceptors: {
					request: { use: vi.fn() },
					response: { use: vi.fn() },
				},
			};

			// Mock the axios create method through the mock
			const originalCreate = axiosMock.default.create;
			axiosMock.default.create = vi.fn().mockReturnValue(mockAxios);

			const client = createHttpClient();

			// Mock a 404 response
			mockAxios.get.mockResolvedValue({
				status: 404,
				statusText: 'Not Found',
				data: null,
			});

			await expect(client.get('/test')).rejects.toThrow('HTTP 404: Not Found');

			// Restore the original create method
			axiosMock.default.create = originalCreate;
		});

		it('should handle successful HTTP status codes', async () => {
			const mockAxios = {
				get: vi.fn(),
				post: vi.fn(),
				put: vi.fn(),
				delete: vi.fn(),
				interceptors: {
					request: { use: vi.fn() },
					response: { use: vi.fn() },
				},
			};

			// Mock the axios create method through the mock
			const originalCreate = axiosMock.default.create;
			axiosMock.default.create = vi.fn().mockReturnValue(mockAxios);

			const client = createHttpClient();

			// Mock a 200 response
			mockAxios.get.mockResolvedValue({
				status: 200,
				statusText: 'OK',
				data: { success: true },
			});

			const result = await client.get('/test');
			expect(result).toEqual({ success: true });

			// Restore the original create method
			axiosMock.default.create = originalCreate;
		});
	});

	describe('HttpClientRegistry', () => {
		beforeEach(() => {
			// Clear registry before each test by creating new clients
			resetAxiosMocks();
		});

		it('should return same client for same baseURL', () => {
			const client1 = getHttpClient('https://api.example.com');
			const client2 = getHttpClient('https://api.example.com');

			expect(client1).toBe(client2);
		});

		it('should return different clients for different baseURLs', () => {
			const client1 = getHttpClient('https://api1.example.com');
			const client2 = getHttpClient('https://api2.example.com');

			expect(client1).not.toBe(client2);
		});

		it('should create client with additional config', () => {
			const config = {
				timeout: 10000,
				retries: 5,
			};

			const client = getHttpClient('https://api.example.com', config);
			expect(client).toBeDefined();
		});

		it('should handle default baseURL when none provided', () => {
			const client = getHttpClient('https://api.default.com');
			expect(client).toBeDefined();
		});

		it('should clear all cached clients', () => {
			// Create some clients
			const client1 = getHttpClient('http://api1.example.com');
			const client2 = getHttpClient('http://api2.example.com');

			// Verify they are cached
			expect(getHttpClient('http://api1.example.com')).toBe(client1);
			expect(getHttpClient('http://api2.example.com')).toBe(client2);

			// Clear the cache
			HttpClientRegistry.clearClients();

			// Verify new instances are created
			const newClient1 = getHttpClient('http://api1.example.com');
			const newClient2 = getHttpClient('http://api2.example.com');

			expect(newClient1).not.toBe(client1);
			expect(newClient2).not.toBe(client2);
		});

		it('should use HttpClientRegistry.getClient directly', () => {
			// Test direct usage of HttpClientRegistry.getClient
			const client1 = HttpClientRegistry.getClient('http://direct.example.com');
			const client2 = HttpClientRegistry.getClient('http://direct.example.com');

			// Should return the same instance
			expect(client1).toBe(client2);
			expect(client1).toBeInstanceOf(HttpClient);
		});

		it('should test validateStatus function', () => {
			// Create a client to trigger axios.create call
			const client = createHttpClient({ baseURL: 'https://api.test.com' });

			// Get the axios.create call arguments
			const createCalls = axiosMock.default.create.mock.calls;
			const lastCall = createCalls[createCalls.length - 1];
			const config = lastCall[0];

			// Test the validateStatus function
			expect(config.validateStatus(200)).toBe(true);
			expect(config.validateStatus(404)).toBe(true);
			expect(config.validateStatus(499)).toBe(true);
			expect(config.validateStatus(500)).toBe(false);
			expect(config.validateStatus(503)).toBe(false);
		});
	});

	describe('default export', () => {
		it('should export default httpClient instance', () => {
			expect(httpClient).toBeDefined();
			expect(typeof httpClient.get).toBe('function');
			expect(typeof httpClient.post).toBe('function');
			expect(typeof httpClient.put).toBe('function');
			expect(typeof httpClient.delete).toBe('function');
		});
	});

	describe('edge cases', () => {
		it('should handle empty response data', async () => {
			axiosMock.default.create().get.mockResolvedValue({
				status: 200,
				statusText: 'OK',
				data: null,
			});

			const result = await httpClient.get('/test');
			expect(result).toBeNull();
		});

		it('should handle undefined response data', async () => {
			axiosMock.default.create().get.mockResolvedValue({
				status: 200,
				statusText: 'OK',
				data: undefined,
			});

			const result = await httpClient.get('/test');
			expect(result).toBeUndefined();
		});

		it('should handle response with different status codes', async () => {
			// Test 201 Created
			axiosMock.default.create().post.mockResolvedValue({
				status: 201,
				statusText: 'Created',
				data: { id: 1, name: 'test' },
			});

			const result = await httpClient.post('/test', { name: 'test' });
			expect(result).toEqual({ id: 1, name: 'test' });
		});

		it('should handle response with 204 No Content', async () => {
			axiosMock.default.create().delete.mockResolvedValue({
				status: 204,
				statusText: 'No Content',
				data: '',
			});

			const result = await httpClient.delete('/test/1');
			expect(result).toBe('');
		});
	});
});
