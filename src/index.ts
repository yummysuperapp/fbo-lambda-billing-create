import { APIGatewayProxyEventV2, Context, APIGatewayProxyResult } from 'aws-lambda';
import { GetBillHandler, CreateBillHandler } from '@/handlers';
import { getHttpEventMethod, createResponse, createLogger, getErrorMessage } from '@/utils';
import { config, NODE_ENV } from '@/config';
import { HttpMethod, HttpStatus, HttpStatusMessage } from '@/constants';
import { isAuthorized } from '@/autorization';
import { createMongoClient, createBigQueryClient } from '@/clients';

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResult> => {
	const logger = createLogger('LambdaHandler', context.awsRequestId);

	logger.info('Lambda function invoked', {
		environment: NODE_ENV,
		requestId: context.awsRequestId,
		functionName: context.functionName,
		functionVersion: context.functionVersion,
		remainingTimeInMillis: context.getRemainingTimeInMillis(),
		config,
	});

	try {
		const method = getHttpEventMethod(event);
		const isAuth = isAuthorized(config, event.headers['Authorization'] || event.headers['authorization']);
		if (isAuth === null) {
			return createResponse(HttpStatus.UNAUTHORIZED, HttpStatusMessage[HttpStatus.UNAUTHORIZED]);
		}
		if (isAuth == false) {
			return createResponse(HttpStatus.FORBIDDEN, HttpStatusMessage[HttpStatus.FORBIDDEN]);
		}

		const clients = {
			mongo: createMongoClient(config.mongo, logger),
			bigquery: createBigQueryClient(config.bigquery, logger),
		};

		if (method === HttpMethod.GET) {
			const datasetId = event.queryStringParameters?.datasetId || 'raw-superapp.backoffice_raw';
			const response = await clients.bigquery.datasetExists(datasetId);
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
		const errorMessage = getErrorMessage(error);

		logger.error('Lambda function failed', error as Error, {
			requestId: context.awsRequestId,
			errorMessage,
		});

		return createResponse(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatusMessage[HttpStatus.INTERNAL_SERVER_ERROR], {
			error: errorMessage,
		});
	}
};
