import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * AWS Lambda Event Types
 */

// Custom Event Types
export interface CustomEvent {
  action: string;
  data?: FBOLambda.UnknownRecord;
  payload?: FBOLambda.UnknownRecord; // For backward compatibility
  metadata?: FBOLambda.UnknownRecord;
}

// Union type for all supported events
export type LambdaEvent = APIGatewayEvent | APIGatewayProxyEvent | CustomEvent;
