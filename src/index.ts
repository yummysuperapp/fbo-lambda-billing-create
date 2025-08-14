import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { isHttpEvent, getHttpEventMethod, createResponse } from '@/utils';
import { HttpStatus, HttpStatusMessage, HttpMethod } from '@/constants';

export const handler = async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  if (!isHttpEvent(event)) {
    return createResponse(
      HttpStatus.OK,
      HttpStatusMessage[HttpStatus.OK],
      {
        message: HttpStatusMessage[HttpStatus.OK],
        event,
      }
    );
  }

  const method = getHttpEventMethod(event);
  if (method === HttpMethod.GET) {
     return createResponse(
      HttpStatus.OK,
      HttpStatusMessage[HttpStatus.OK],
      {
        message: HttpStatusMessage[HttpStatus.OK],
        event: {
          'HTTP method:': event.httpMethod,
          'HTTP path:': event.path,
          'HTTP protocol:': event.requestContext.protocol,
          'HTTP source IP:': event.requestContext.identity?.sourceIp,
          'HTTP user agent:': event.requestContext.identity?.userAgent,
        },
        context: _context,
      }
    );
  }

  return createResponse(
    HttpStatus.NO_CONTENT,
    HttpStatusMessage[HttpStatus.NO_CONTENT],
  );
};
