import type { HttpClientInterface, FinanceConfig, Logger } from '@/types';
import { createLogger } from '@/utils';

/**
 * Interface for finance API responses
 */
interface FinanceApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}

/**
 * Interface for dispersion data
 */
interface DispersionData {
	fileName: string;
	fileSize: number;
	uploadTime: string;
	metadata?: Record<string, unknown>;
}

/**
 * Service for interacting with Finance API
 */
export class FinanceService {
	private readonly logger: Logger;
	private readonly httpClient: HttpClientInterface;
	private readonly config: FinanceConfig;

	constructor(httpClient: HttpClientInterface, config: FinanceConfig) {
		this.httpClient = httpClient;
		this.config = config;
		this.logger = createLogger('FinanceService');
	}

	/**
	 * Sends dispersion file information to Finance API
	 */
	async sendDispersionData(data: DispersionData): Promise<FinanceApiResponse> {
		try {
			this.logger.info('Sending dispersion data to Finance API', {
				fileName: data.fileName,
				fileSize: data.fileSize,
				endpoint: this.config.dispersionEndpoint,
			});

			const response = await this.httpClient.post<FinanceApiResponse>(
				`${this.config.baseUrl}${this.config.dispersionEndpoint}`,
				data,
				{
					headers: {
						'X-API-Key': this.config.apiKey,
						'Content-Type': 'application/json',
					},
					timeout: 30000,
				}
			);

			this.logger.info('Dispersion data sent successfully', {
				fileName: data.fileName,
				success: response.success,
				message: response.message,
			});

			return response;
		} catch (error) {
			this.logger.error('Failed to send dispersion data', error as Error, {
				fileName: data.fileName,
				endpoint: this.config.dispersionEndpoint,
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Validates file format for finance processing
	 */
	validateFinanceFile(fileName: string, fileSize: number): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Check file extension
		const allowedExtensions = ['.csv', '.xlsx', '.txt'];
		const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

		if (!allowedExtensions.includes(fileExtension)) {
			errors.push(`Invalid file extension: ${fileExtension}. Allowed: ${allowedExtensions.join(', ')}`);
		}

		// Check file size (max 50MB)
		const maxSizeBytes = 50 * 1024 * 1024;
		if (fileSize > maxSizeBytes) {
			errors.push(`File size exceeds maximum allowed size of 50MB`);
		}

		// Check minimum file size (at least 1KB)
		const minSizeBytes = 1024;
		if (fileSize < minSizeBytes) {
			errors.push(`File size is too small (minimum 1KB required)`);
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Gets finance API health status
	 */
	async getHealthStatus(): Promise<{ healthy: boolean; responseTime?: number }> {
		const startTime = Date.now();

		try {
			await this.httpClient.get(`${this.config.baseUrl}/health`, {
				headers: {
					'X-API-Key': this.config.apiKey,
				},
				timeout: 5000,
			});

			const responseTime = Date.now() - startTime;

			this.logger.info('Finance API health check successful', { responseTime });

			return { healthy: true, responseTime };
		} catch (error) {
			const responseTime = Date.now() - startTime;

			this.logger.error('Finance API health check failed', error as Error, { responseTime });

			return { healthy: false, responseTime };
		}
	}
}
