/**
 * AWS Lambda Event Types
 */

// S3 Event Types
export interface S3EventRecord {
  eventVersion: string;
  eventSource: string;
  awsRegion: string;
  eventTime: string;
  eventName: string;
  userIdentity?: {
    principalId: string;
  };
  requestParameters?: {
    sourceIPAddress: string;
  };
  responseElements?: {
    'x-amz-request-id': string;
    'x-amz-id-2': string;
  };
  s3: {
    s3SchemaVersion?: string;
    configurationId?: string;
    bucket: {
      name: string;
      ownerIdentity?: {
        principalId: string;
      };
      arn?: string;
    };
    object: {
      key: string;
      size: number;
      eTag?: string;
      sequencer?: string;
    };
  };
}

export interface S3Event {
  Records: S3EventRecord[];
}

// API Gateway Event Types
export interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  headers: FBOLambda.StringRecord;
  queryStringParameters: FBOLambda.StringRecord | null;
  body: string | null;
  isBase64Encoded: boolean;
}

// Lambda Context Types
export interface LambdaContext {
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  getRemainingTimeInMillis(): number;
}

// Custom Event Types
export interface CustomEvent {
  action: string;
  data?: FBOLambda.UnknownRecord;
  payload?: FBOLambda.UnknownRecord; // For backward compatibility
  metadata?: FBOLambda.UnknownRecord;
}

// Union type for all supported events
export type LambdaEvent = S3Event | APIGatewayEvent | CustomEvent;