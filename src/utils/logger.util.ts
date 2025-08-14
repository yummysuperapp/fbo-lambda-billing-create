import type { Logger } from '@/types';

/**
 * Enhanced logger with structured logging for AWS Lambda
 */
export class LambdaLogger implements Logger {
	private context: Record<string, unknown> = {};
	private requestId?: string;

	constructor(
		private readonly serviceName: string,
		requestId?: string
	) {
		if (requestId) {
			this.requestId = requestId;
		}
	}

	private log(level: string, message: string, error?: Error, context?: Record<string, unknown>): void {
		const logEntry = {
			timestamp: new Date().toISOString(),
			level,
			service: this.serviceName,
			message,
			...(this.requestId && { requestId: this.requestId }),
			...this.context,
			...context,
			...(error && {
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
			}),
		};

		console.warn(JSON.stringify(logEntry));
	}

	info(message: string, meta?: Record<string, unknown>): void {
		this.log('info', message, undefined, meta);
	}

	error(message: string, error?: Error, meta?: Record<string, unknown>): void {
		this.log('error', message, error, meta);
	}

	warn(message: string, meta?: Record<string, unknown>): void {
		this.log('warn', message, undefined, meta);
	}

	debug(message: string, meta?: Record<string, unknown>): void {
		this.log('debug', message, undefined, meta);
	}

	/**
	 * Creates a child logger with additional context
	 */
	child(additionalContext: string): LambdaLogger {
		return new LambdaLogger(`${this.serviceName}:${additionalContext}`, this.requestId);
	}
}

/**
 * Creates a logger instance for the given context
 */
export function createLogger(context: string, requestId?: string): Logger {
	return new LambdaLogger(context, requestId);
}

/**
 * Default logger instance
 */
export const logger = createLogger('FBO-Lambda');
