import { LambdaEvent, LambdaResponse, HttpStatus, HttpStatusMessage, HttpMethod } from '@/types';
import { isHttpEvent, getHttpEventMethod, createHttpResponse } from '@/utils/helpers.util';

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  if (!isHttpEvent(event)) {
    return createHttpResponse(
      HttpStatus.OK,
      HttpStatusMessage[HttpStatus.OK], {
        event,
    });
  }

  const method = getHttpEventMethod(event);
  if (method === HttpMethod.GET) {
     return createHttpResponse(
      HttpStatus.OK,
      HttpStatusMessage[HttpStatus.OK], {
        event: {
          'HTTP method:': event.requestContext.http.method,
          'HTTP path:': event.requestContext.http.path,
          'HTTP protocol:': event.requestContext.http.protocol,
          'HTTP source IP:': event.requestContext.http.sourceIp,
          'HTTP user agent:': event.requestContext.http.userAgent,
        },
    });
  }


  return createHttpResponse(
    HttpStatus.NO_CONTENT,
    HttpStatusMessage[HttpStatus.NO_CONTENT],
  );
};
