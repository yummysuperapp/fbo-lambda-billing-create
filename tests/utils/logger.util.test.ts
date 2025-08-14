import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LambdaLogger, createLogger, logger } from '@/utils/logger.util';

describe('Logger Utils', () => {
	let consoleSpy: any;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	describe('LambdaLogger', () => {
		it('should create logger with service name', () => {
			const testLogger = new LambdaLogger('TestService');
			expect(testLogger).toBeInstanceOf(LambdaLogger);
		});

		it('should create logger with service name and request ID', () => {
			const testLogger = new LambdaLogger('TestService', 'req-123');
			expect(testLogger).toBeInstanceOf(LambdaLogger);
		});

		describe('info logging', () => {
			it('should log info message', () => {
				const testLogger = new LambdaLogger('TestService');
				testLogger.info('Test info message');

				expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"info"'));
				expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"service":"TestService"'));
				expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"message":"Test info message"'));
			});

			it('should log info message with metadata', () => {
				const testLogger = new LambdaLogger('TestService');
				const meta = { userId: '123', action: 'upload' };
				testLogger.info('Test info message', meta);

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.level).toBe('info');
				expect(logEntry.service).toBe('TestService');
				expect(logEntry.message).toBe('Test info message');
				expect(logEntry.userId).toBe('123');
				expect(logEntry.action).toBe('upload');
				expect(logEntry.timestamp).toBeDefined();
			});

			it('should include request ID when provided', () => {
				const testLogger = new LambdaLogger('TestService', 'req-123');
				testLogger.info('Test message');

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.requestId).toBe('req-123');
			});
		});

		describe('error logging', () => {
			it('should log error message', () => {
				const testLogger = new LambdaLogger('TestService');
				testLogger.error('Test error message');

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.level).toBe('error');
				expect(logEntry.message).toBe('Test error message');
			});

			it('should log error with Error object', () => {
				const testLogger = new LambdaLogger('TestService');
				const error = new Error('Test error');
				testLogger.error('Error occurred', error);

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.level).toBe('error');
				expect(logEntry.message).toBe('Error occurred');
				expect(logEntry.error).toBeDefined();
				expect(logEntry.error.name).toBe('Error');
				expect(logEntry.error.message).toBe('Test error');
				expect(logEntry.error.stack).toBeDefined();
			});

			it('should log error with metadata', () => {
				const testLogger = new LambdaLogger('TestService');
				const error = new Error('Test error');
				const meta = { operation: 'database_query' };
				testLogger.error('Database error', error, meta);

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.operation).toBe('database_query');
				expect(logEntry.error).toBeDefined();
			});
		});

		describe('warn logging', () => {
			it('should log warning message', () => {
				const testLogger = new LambdaLogger('TestService');
				testLogger.warn('Test warning message');

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.level).toBe('warn');
				expect(logEntry.message).toBe('Test warning message');
			});

			it('should log warning with metadata', () => {
				const testLogger = new LambdaLogger('TestService');
				const meta = { retryCount: 3 };
				testLogger.warn('Retry limit reached', meta);

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.retryCount).toBe(3);
			});
		});

		describe('debug logging', () => {
			it('should log debug message', () => {
				const testLogger = new LambdaLogger('TestService');
				testLogger.debug('Test debug message');

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.level).toBe('debug');
				expect(logEntry.message).toBe('Test debug message');
			});

			it('should log debug with metadata', () => {
				const testLogger = new LambdaLogger('TestService');
				const meta = { executionTime: 150 };
				testLogger.debug('Function executed', meta);

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.executionTime).toBe(150);
			});
		});

		describe('child logger', () => {
			it('should create child logger with additional context', () => {
				const parentLogger = new LambdaLogger('TestService', 'req-123');
				const childLogger = parentLogger.child('SubModule');

				expect(childLogger).toBeInstanceOf(LambdaLogger);
			});

			it('should inherit request ID in child logger', () => {
				const parentLogger = new LambdaLogger('TestService', 'req-123');
				const childLogger = parentLogger.child('SubModule');

				childLogger.info('Child message');

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.requestId).toBe('req-123');
			});
		});

		describe('log structure', () => {
			it('should include timestamp in log entry', () => {
				const testLogger = new LambdaLogger('TestService');
				testLogger.info('Test message');

				const logCall = consoleSpy.mock.calls[0][0];
				const logEntry = JSON.parse(logCall);

				expect(logEntry.timestamp).toBeDefined();
				expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date);
			});

			it('should produce valid JSON output', () => {
				const testLogger = new LambdaLogger('TestService');
				testLogger.info('Test message', { complex: { nested: 'object' } });

				const logCall = consoleSpy.mock.calls[0][0];

				expect(() => JSON.parse(logCall)).not.toThrow();
			});
		});
	});

	describe('createLogger factory function', () => {
		it('should create logger with context', () => {
			const testLogger = createLogger('TestContext');
			expect(testLogger).toBeInstanceOf(LambdaLogger);
		});

		it('should create logger with context and request ID', () => {
			const testLogger = createLogger('TestContext', 'req-456');
			expect(testLogger).toBeInstanceOf(LambdaLogger);

			testLogger.info('Test message');

			const logCall = consoleSpy.mock.calls[0][0];
			const logEntry = JSON.parse(logCall);

			expect(logEntry.requestId).toBe('req-456');
		});
	});

	describe('default logger instance', () => {
		it('should export default logger instance', () => {
			expect(logger).toBeDefined();
			expect(typeof logger.info).toBe('function');
			expect(typeof logger.error).toBe('function');
			expect(typeof logger.warn).toBe('function');
			expect(typeof logger.debug).toBe('function');
		});

		it('should use default service name', () => {
			logger.info('Default logger test');

			const logCall = consoleSpy.mock.calls[0][0];
			const logEntry = JSON.parse(logCall);

			expect(logEntry.service).toBe('FBO-Lambda');
		});
	});
});
