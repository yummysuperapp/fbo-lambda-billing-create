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

// Legacy API Gateway REST (v1) - kept for backward compatibility if needed
export interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  headers: FBOLambda.StringRecord;
  queryStringParameters: FBOLambda.StringRecord | null;
  body: string | null;
  isBase64Encoded: boolean;
}

// API Gateway HTTP API (v2) Event Types
export interface HttpEvent {
  version: string; // e.g., "2.0"
  routeKey: string; // e.g., "GET /billing"
  rawPath: string; // e.g., "/develop/billing"
  rawQueryString: string; // raw query string
  cookies?: string[];
  headers: FBOLambda.StringRecord;
  queryStringParameters?: FBOLambda.StringRecord | null;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix?: string;
    http: {
      method: string; // e.g., "GET"
      path: string; // e.g., "/develop/billing"
      protocol: string; // e.g., "HTTP/1.1"
      sourceIp: string;
      userAgent?: string;
    };
    requestId: string;
    routeKey: string;
    stage: string; // e.g., "develop"
    time: string; // e.g., "13/Aug/2025:23:15:01 +0000"
    timeEpoch: number; // e.g., 1755126901525
  };
  body?: string | null;
  isBase64Encoded: boolean;
  pathParameters?: FBOLambda.StringRecord | null;
  stageVariables?: FBOLambda.StringRecord | null;
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
export type LambdaEvent = S3Event | APIGatewayEvent | HttpEvent | CustomEvent;