import type { LambdaEvent, LambdaResponse } from '@/types';
import { isHttpEvent, getHttpEventMethod, createResponse } from '@/utils';
import { HttpStatus, HttpStatusMessage, HttpMethod } from '@/constants';

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  if (!isHttpEvent(event)) {
    return createResponse(
      HttpStatus.OK,
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
      {
        message: HttpStatusMessage[HttpStatus.OK],
        event: {
          'HTTP method:': event.requestContext.http.method,
          'HTTP path:': event.requestContext.http.path,
          'HTTP protocol:': event.requestContext.http.protocol,
          'HTTP source IP:': event.requestContext.http.sourceIp,
          'HTTP user agent:': event.requestContext.http.userAgent,
        },
      }
    );
  }

  return createResponse(
    HttpStatus.NO_CONTENT,
    {
      message: HttpStatusMessage[HttpStatus.NO_CONTENT],
    }
  );
};
