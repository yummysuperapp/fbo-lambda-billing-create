import { APIGatewayProxyResult } from 'aws-lambda';
import { HttpStatus, HttpStatusMessage } from '@/constants';
import { createResponse, safeJsonParse } from '@/utils';
import { Bill } from '@/types';

export function GetBillHandler(payload: string | undefined): Promise<APIGatewayProxyResult> {
	if (!payload)
		return Promise.resolve(createResponse(HttpStatus.BAD_REQUEST, HttpStatusMessage[HttpStatus.BAD_REQUEST]));

	return new Promise((resolve) => {
		const resp = safeJsonParse(payload) as Bill;
		const response = createResponse(HttpStatus.OK, HttpStatusMessage[HttpStatus.OK], {
			bill: resp,
		});
		resolve(response);
	});
}
