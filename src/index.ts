import { APIGatewayProxyEventV2, Context, APIGatewayProxyResult } from 'aws-lambda';
import { getHttpEventMethod, createResponse } from '@/utils';
import { HttpStatus, HttpStatusMessage } from '@/constants';

export const handler = async (
  event: APIGatewayProxyEventV2,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  const method = getHttpEventMethod(event);

  return createResponse(HttpStatus.OK, HttpStatusMessage[HttpStatus.OK], {
    message: HttpStatusMessage[HttpStatus.OK],
    method,
    context: _context,
  });
};
