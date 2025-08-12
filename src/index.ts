import type { 
  LambdaEvent, 
  LambdaResponse
} from '@/types';

export const handler = async (event: LambdaEvent) => {
  const response: LambdaResponse = {
    statusCode: 200,
    body: {
      message: 'Hello from Lambda!',
      event,
    },
  };
  return response;
};
