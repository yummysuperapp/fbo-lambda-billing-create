import { APIGatewayProxyEventV2, Context, APIGatewayProxyResult } from 'aws-lambda';
import { GetBillHandler, CreateBillHandler } from '@/handlers';
import { getHttpEventMethod, createResponse, createLogger, getErrorMessage } from '@/utils';
import { config, NODE_ENV } from '@/config';
import { HttpStatus, HttpStatusMessage } from '@/constants';

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

		switch (method) {
			case 'GET': {
				const getResponse = await GetBillHandler(event.body);
				logger.info('Lambda function completed successfully', {
					requestId: context.awsRequestId,
					result: getResponse,
				});
				return getResponse;
			}
			case 'POST': {
				const postResponse = CreateBillHandler(event.body);
				logger.info('Lambda function completed successfully', {
					requestId: context.awsRequestId,
					result: postResponse,
				});
				return postResponse;
			}
			default: {
				const defaultResponse = createResponse(
					HttpStatus.METHOD_NOT_ALLOWED,
					HttpStatusMessage[HttpStatus.METHOD_NOT_ALLOWED]
				);
				logger.info('Lambda function completed successfully', {
					requestId: context.awsRequestId,
					result: defaultResponse,
				});
				return defaultResponse;
			}
		}
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