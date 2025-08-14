import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Agent } from 'https';
import { createLogger, retryWithBackoff } from '@/utils';
import type { HttpClientInterface, HttpRequestConfig, Logger } from '@/types';

/**
 * HTTP Client configuration
 */
interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * Enhanced HTTP Client with retry logic and connection pooling
 */
export class HttpClient implements HttpClientInterface {
  private readonly client: AxiosInstance;
  private readonly logger: Logger;
  private readonly retries: number;
  private readonly retryDelay: number;

  constructor(config: HttpClientConfig = {}) {
    this.logger = createLogger('HttpClient');
    this.retries = config.retries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    // Create HTTPS agent for connection pooling and SSL optimization
    const httpsAgent = new Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 60000,
      rejectUnauthorized: true,
    });

    this.client = axios.create({
      ...(config.baseURL && { baseURL: config.baseURL }),
      timeout: config.timeout ?? 30000,
      httpsAgent,
      headers: {
        'User-Agent': 'Yummy-FBO-Lambda/1.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...config.headers,
      },
      validateStatus: (status: number) => status < 500, // Don't throw on 4xx errors
    });

    this.setupInterceptors();

    this.logger.info('HTTP Client initialized', {
      baseURL: config.baseURL,
      timeout: config.timeout,
      retries: this.retries,
    });
  }

  /**
   * Sets up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('HTTP Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: this.sanitizeHeaders(config.headers),
        });
        return config;
      },
      (error: AxiosError) => {
        this.logger.error('HTTP Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.debug('HTTP Response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          responseTime: this.getResponseTime(response),
        });
        return response;
      },
      (error: AxiosError) => {
        this.logger.error('HTTP Response Error', error, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          responseTime: error.response ? this.getResponseTime(error.response) : undefined,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Sanitizes headers for logging (removes sensitive information)
   */
  private sanitizeHeaders(headers: unknown): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveKeys = ['authorization', 'x-api-key', 'cookie', 'set-cookie'];

    if (!headers || typeof headers !== 'object') {
      return sanitized;
    }

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  /**
   * Calculates response time from axios response
   */
  private getResponseTime(response: AxiosResponse): number | undefined {
    const requestTime = (response.config as AxiosRequestConfig & { metadata?: { startTime: number } }).metadata
      ?.startTime;
    return requestTime ? Date.now() - requestTime : undefined;
  }

  /**
   * Converts HttpRequestConfig to AxiosRequestConfig
   */
  private toAxiosConfig(config?: HttpRequestConfig): AxiosRequestConfig & { metadata: { startTime: number } } {
    return {
      headers: config?.headers as Record<string, string> | undefined,
      timeout: config?.timeout,
      params: config?.params,
      metadata: { startTime: Date.now() },
    } as AxiosRequestConfig & { metadata: { startTime: number } };
  }

  /**
   * Executes HTTP request with retry logic
   */
  private async executeRequest<T>(requestFn: () => Promise<AxiosResponse<T>>): Promise<T> {
    return retryWithBackoff(
      async () => {
        const response = await requestFn();

        // Handle HTTP error status codes
        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.data;
      },
      this.retries,
      this.retryDelay
    );
  }

  /**
   * Performs GET request
   */
  async get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T> {
    return this.executeRequest(() => this.client.get<T>(url, this.toAxiosConfig(config)));
  }

  /**
   * Performs POST request
   */
  async post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    return this.executeRequest(() => this.client.post<T>(url, data, this.toAxiosConfig(config)));
  }

  /**
   * Performs PUT request
   */
  async put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    return this.executeRequest(() => this.client.put<T>(url, data, this.toAxiosConfig(config)));
  }

  /**
   * Performs DELETE request
   */
  async delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T> {
    return this.executeRequest(() => this.client.delete<T>(url, this.toAxiosConfig(config)));
  }
}

/**
 * Client registry for managing multiple HTTP clients
 */
class HttpClientRegistry {
  private static clients = new Map<string, HttpClient>();

  /**
   * Gets or creates an HTTP client for the given base URL
   */
  static getClient(baseURL: string, config?: Omit<HttpClientConfig, 'baseURL'>): HttpClient {
    if (!this.clients.has(baseURL)) {
      this.clients.set(baseURL, new HttpClient({ ...config, baseURL }));
    }
    return this.clients.get(baseURL)!;
  }

  /**
   * Clears all cached clients
   */
  static clearClients(): void {
    this.clients.clear();
  }
}

/**
 * Factory function to create HTTP client
 */
export function createHttpClient(config?: HttpClientConfig): HttpClientInterface {
  return new HttpClient(config);
}

/**
 * Gets a cached HTTP client for the given base URL
 */
export function getHttpClient(baseURL: string, config?: Omit<HttpClientConfig, 'baseURL'>): HttpClientInterface {
  return HttpClientRegistry.getClient(baseURL, config);
}

/**
 * Default HTTP client instance
 */
export const httpClient = createHttpClient();

/**
 * Export HttpClientRegistry for testing
 */
export { HttpClientRegistry };
