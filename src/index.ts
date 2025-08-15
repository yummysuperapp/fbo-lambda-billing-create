import { APIGatewayProxyEventV2, Context, APIGatewayProxyResult } from 'aws-lambda';
import { GetBillHandler, CreateBillHandler } from '@/handlers';
import { getHttpEventMethod, createResponse, createLogger, getErrorMessage } from '@/utils';
import { config, NODE_ENV } from '@/config';
import { HttpMethod, HttpStatus, HttpStatusMessage } from '@/constants';
import { isAuthorized } from '@/autorization';
import { createMongoClient, createBigQueryClient } from '@/clients';

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResult> => {
	// Create a logger with the request ID
	const logger = createLogger('LambdaHandler', context.awsRequestId);

	// Get the HTTP method from the event
	const method = getHttpEventMethod(event);
	if (!method)
		// If the method is not found, return a 405 Method Not Allowed response
		return createResponse(HttpStatus.METHOD_NOT_ALLOWED, HttpStatusMessage[HttpStatus.METHOD_NOT_ALLOWED]);

	// Log the Lambda function invocation
	logger.info('Lambda function invoked :: START', {
		environment: NODE_ENV,
		requestId: context.awsRequestId,
		functionName: context.functionName,
		functionVersion: context.functionVersion,
		remainingTimeInMillis: context.getRemainingTimeInMillis(),
		method,
	});

	try {
		const autorization = event.headers['Authorization'] || event.headers['authorization'];
		const isAuth = isAuthorized(config, autorization);
		if (isAuth === null) {
			return createResponse(HttpStatus.UNAUTHORIZED, HttpStatusMessage[HttpStatus.UNAUTHORIZED]);
		}
		if (isAuth == false) {
			return createResponse(HttpStatus.FORBIDDEN, HttpStatusMessage[HttpStatus.FORBIDDEN]);
		}

		// Create clients for Lambda function
		const clients: FBOLambda.Clients = {
			mongo: createMongoClient(config.mongo, logger),
			bigquery: createBigQueryClient(config.bigquery, logger),
		};

		if (method === HttpMethod.GET) {
			const response = await clients.bigquery?.query('SELECT * FROM `backoffice_raw.bills`');
			logger.info('Get dataset exists', {
				requestId: context.awsRequestId,
				result: response,
				method,
			});

			return createResponse(HttpStatus.OK, HttpStatusMessage[HttpStatus.OK], {
				bill: response,
			});
		}

		if (method === HttpMethod.PATCH) {
			const response = await GetBillHandler(event.body);
			logger.info('Lambda function completed successfully', {
				requestId: context.awsRequestId,
				result: response,
				method,
			});
			return response;
		}

		if (method === HttpMethod.POST) {
			const response = CreateBillHandler(event.body);
			logger.info('Lambda function completed successfully', {
				requestId: context.awsRequestId,
				result: response,
				method,
			});
			return response;
		}

		const response = createResponse(HttpStatus.METHOD_NOT_ALLOWED, HttpStatusMessage[HttpStatus.METHOD_NOT_ALLOWED]);
		logger.info('Lambda function completed successfully', {
			requestId: context.awsRequestId,
			result: response,
			method,
		});
		return response;
	} catch (error) {
		// Catch any errors that occur during Lambda function execution
		const errorMessage = getErrorMessage(error);

		// Log the Lambda function failure
		logger.error('Lambda function failed :: END', error as Error, {
			requestId: context.awsRequestId,
			errorMessage,
		});

		// Return a 500 Internal Server Error response
		return createResponse(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatusMessage[HttpStatus.INTERNAL_SERVER_ERROR], {
			error: errorMessage,
		});
	}
};
