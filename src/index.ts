import type { 
  LambdaEvent, 
  LambdaResponse
} from '@/types';

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    const response: LambdaResponse = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Hello from Lambda!',
        timestamp: new Date().toISOString(),
        event,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
    return response;
  } catch (error) {
    console.error('Lambda execution error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
