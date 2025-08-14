import { APIGatewayProxyEventV2, Context, APIGatewayProxyResult } from 'aws-lambda';
import { getHttpEventMethod, createResponse } from '@/utils';
import { HttpStatus, HttpStatusMessage } from '@/constants';
import { GetBillingHandler } from '@/handlers';

export const handler = async (event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyResult> => {
	const method = getHttpEventMethod(event);

	switch (method) {
		case 'GET':
			return GetBillingHandler(event.body);
		case 'POST':
			return createResponse(HttpStatus.OK, HttpStatusMessage[HttpStatus.OK], {
				message: 'POST method received',
				method,
				context: _context,
			});
		default:
			return createResponse(HttpStatus.METHOD_NOT_ALLOWED, HttpStatusMessage[HttpStatus.METHOD_NOT_ALLOWED], {
				message: `Method ${method} not allowed`,
				method,
				context: _context,
			});
	}
};
