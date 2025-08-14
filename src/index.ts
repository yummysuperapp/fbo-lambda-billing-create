import { LambdaEvent, LambdaResponse, HttpStatus, HttpStatusMessage, HttpMethod } from '@/types';
import { isHttpEvent, getHttpEventMethod } from '@/utils/helpers.util';

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  if (!isHttpEvent(event)) {
    return {
      statusCode: HttpStatus.OK,
      statusMessage: HttpStatusMessage[HttpStatus.OK],
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello from Lambda!',
        event,
      }),
    } as LambdaResponse
  }

  const method = getHttpEventMethod(event);
  if (method === HttpMethod.GET) {
    return {
      statusCode: HttpStatus.OK,
      statusMessage: HttpStatusMessage[HttpStatus.OK],
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: HttpStatusMessage[HttpStatus.OK],
        event: {
          'HTTP method:': event.requestContext.http.method,
          'HTTP path:': event.requestContext.http.path,
          'HTTP protocol:': event.requestContext.http.protocol,
          'HTTP source IP:': event.requestContext.http.sourceIp,
          'HTTP user agent:': event.requestContext.http.userAgent,
        },
      }),
    } as LambdaResponse;
  }

  return {
      statusCode: HttpStatus.OK,
      statusMessage: HttpStatusMessage[HttpStatus.OK],
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello from Lambda!',
        event,
      }),
    } as LambdaResponse
};
