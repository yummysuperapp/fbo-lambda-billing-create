import type { 
  LambdaEvent, 
  LambdaResponse, 
  S3Event, 
  CustomEvent,
  HandlerContext 
} from '@/types';
import type { Context } from 'aws-lambda';
import { 
  createLogger, 
  createErrorResponse, 
  createSuccessResponse,
  getErrorMessage 
} from '@/utils';
import { config, IS_DEVELOPMENT as isDevelopment, NODE_ENV } from '@/config';
import { 
  createHttpClient, 
  createS3Client, 
  createPostgresClient, 
  createMongoClient 
} from '@/clients';

/**
 * Main Lambda handler function
 */
export const handler = async (
  event: LambdaEvent,
  context: Context
): Promise<LambdaResponse> => {
  const logger = createLogger('LambdaHandler', context.awsRequestId);
  
  logger.info('Lambda function invoked', {
    eventType: getEventType(event),
    requestId: context.awsRequestId,
    functionName: context.functionName,
    functionVersion: context.functionVersion,
    remainingTimeInMillis: context.getRemainingTimeInMillis(),
  });

  const handlerContext: HandlerContext = {
    requestId: context.awsRequestId,
    functionName: context.functionName,
    environment: NODE_ENV as FBOLambda.Environment,
    startTime: Date.now(),
    logger,
    clients: {
      http: createHttpClient(),
      s3: createS3Client(),
      postgres: createPostgresClient(config.postgres, logger),
      mongo: createMongoClient(config.mongo, logger),
    },
  };

  try {
    const result = await processEvent(event, handlerContext);
    
    logger.info('Lambda function completed successfully', {
      requestId: context.awsRequestId,
      result,
    });

    return createSuccessResponse(result);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    
    logger.error('Lambda function failed', error as Error, {
      requestId: context.awsRequestId,
      errorMessage,
    });

    return createErrorResponse(errorMessage, 500);
  }
};

/**
 * Processes the incoming event based on its type
 */
async function processEvent(
  event: LambdaEvent, 
  context: HandlerContext
): Promise<{ message: string; processedItems?: number }> {
  const eventType = getEventType(event);
  
  context.logger.info('Processing event', { eventType });

  switch (eventType) {
    case 's3':
      return await processS3Event(event as S3Event, context);
    
    case 'custom':
      return await processCustomEvent(event as CustomEvent, context);
    
    default:
      throw new Error(`Unsupported event type: ${eventType}`);
  }
}

/**
 * Processes S3 events for file processing
 */
async function processS3Event(
  event: S3Event, 
  context: HandlerContext
): Promise<{ message: string; processedItems: number }> {
  context.logger.info('Processing S3 event', { recordCount: event.Records.length });
  
  // Process each S3 record
  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;
    
    context.logger.info('Processing S3 object', { bucketName, objectKey });
    
    // Add your S3 file processing logic here
    // For example: download file, process content, store results, etc.
  }
  
  return {
    message: 'S3 event processed successfully',
    processedItems: event.Records.length,
  };
}

/**
 * Processes custom events for various actions
 */
async function processCustomEvent(
  event: CustomEvent, 
  context: HandlerContext
): Promise<{ message: string }> {
  const { action } = event;
  
  context.logger.info('Processing custom event', { action });

  switch (action) {
    case 'health_check':
      return { message: 'Health check passed' };
    
    case 'process_data':
      // Add your custom data processing logic here
      return { message: 'Data processed successfully' };
    
    case 'download_bank_files':
      // Add your bank files download logic here
      return { message: 'download_bank_files action completed successfully' };
    
    case 'process_specific_file':
      // Add your specific file processing logic here
      return { message: 'process_specific_file action completed successfully' };
    
    default:
      throw new Error(`Unsupported custom action: ${action}`);
  }
}

/**
 * Determines the type of event received
 */
function getEventType(event: LambdaEvent): 's3' | 'custom' | 'unknown' {
  // Check if it's an S3 event
  if ('Records' in event && Array.isArray(event.Records)) {
    const firstRecord = event.Records[0];
    if (firstRecord && 's3' in firstRecord) {
      return 's3';
    }
  }
  
  // Check if it's a custom event
  if ('action' in event && typeof event.action === 'string') {
    return 'custom';
  }
  
  return 'unknown';
}

/**
 * Main function for local development and testing
 */
async function main(): Promise<void> {
  if (!isDevelopment) {
    console.warn('Main function is only available in development mode');
    return;
  }

  const logger = createLogger('LocalDevelopment');
  
  logger.info('Starting local development mode', {
    nodeEnv: NODE_ENV,
    version: process.env.npm_package_version || 'unknown',
  });

  try {
    // Example S3 event for testing
    const testS3Event: S3Event = {
      Records: [
        {
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          awsRegion: 'us-east-1',
          eventTime: new Date().toISOString(),
          eventName: 's3:ObjectCreated:Put',
          userIdentity: {
            principalId: 'test-principal',
          },
          requestParameters: {
            sourceIPAddress: '127.0.0.1',
          },
          responseElements: {
            'x-amz-request-id': 'test-request-id',
            'x-amz-id-2': 'test-id-2',
          },
          s3: {
            s3SchemaVersion: '1.0',
            configurationId: 'test-config',
            bucket: {
              name: config.aws.s3BucketName,
              ownerIdentity: {
                principalId: 'test-owner',
              },
              arn: `arn:aws:s3:::${config.aws.s3BucketName}`,
            },
            object: {
              key: 'test-files/test-file.csv',
              size: 1024,
              eTag: 'test-etag',
              sequencer: 'test-sequencer',
            },
          },
        },
      ],
    };

    // Mock Lambda context
    const mockContext: Context = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'fbo-lambda-template-dev',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:fbo-lambda-template-dev',
      memoryLimitInMB: '512',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/fbo-lambda-template-dev',
      logStreamName: '2024/01/01/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    };

    // Test S3 event processing
    logger.info('Testing S3 event processing');
    const s3Result = await handler(testS3Event, mockContext);
    logger.info('S3 event test result', { statusCode: s3Result.statusCode });

    // Test custom event processing
    const testCustomEvent: CustomEvent = {
      action: 'health_check',
      payload: {},
    };

    logger.info('Testing custom event processing');
    const customResult = await handler(testCustomEvent, mockContext);
    logger.info('Custom event test result', { statusCode: customResult.statusCode });

    logger.info('Local development testing completed successfully');
  } catch (error) {
    logger.error('Local development testing failed', error as Error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error in main function:', error);
    process.exit(1);
  });
}