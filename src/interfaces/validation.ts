/**
 * @fileoverview Validation Schemas
 *
 * This file contains Zod validation schemas for runtime validation
 * of data structures throughout the application.
 */

import { z } from 'zod';

// S3 Event Validation Schemas
export const S3EventRecordSchema = z.object({
  eventVersion: z.string(),
  eventSource: z.string(),
  awsRegion: z.string(),
  eventTime: z.string(),
  eventName: z.string(),
  s3: z.object({
    bucket: z.object({
      name: z.string(),
    }),
    object: z.object({
      key: z.string(),
      size: z.number(),
    }),
  }),
});

export const S3EventSchema = z.object({
  Records: z.array(S3EventRecordSchema),
});

// API Gateway Event Validation Schema
export const APIGatewayEventSchema = z.object({
  httpMethod: z.string(),
  path: z.string(),
  headers: z.record(z.string()),
  queryStringParameters: z.record(z.string()).nullable(),
  body: z.string().nullable(),
  isBase64Encoded: z.boolean(),
});

// Custom Event Validation Schema
export const CustomEventSchema = z.object({
  action: z.string(),
  data: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Configuration Validation Schemas
export const FinanceConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  dispersionEndpoint: z.string(),
  timeout: z.number().positive(),
});

export const PostgresConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  database: z.string().min(1),
  username: z.string().min(1),
  user: z.string().min(1),
  password: z.string().min(1),
  ssl: z.boolean(),
  maxConnections: z.number().int().positive(),
  connectionTimeout: z.number().positive(),
  connectionTimeoutMillis: z.number().positive(),
  idleTimeoutMillis: z.number().positive(),
});

export const MongoConfigSchema = z.object({
  uri: z.string().min(1),
  database: z.string().min(1),
  maxPoolSize: z.number().int().positive(),
  minPoolSize: z.number().int().nonnegative(),
  maxIdleTimeMS: z.number().positive(),
  serverSelectionTimeoutMS: z.number().positive(),
  options: z.object({
    maxPoolSize: z.number().int().positive(),
    serverSelectionTimeoutMS: z.number().positive(),
    socketTimeoutMS: z.number().positive(),
  }),
});

// Type inference from schemas
export type S3EventRecordType = z.infer<typeof S3EventRecordSchema>;
export type S3EventType = z.infer<typeof S3EventSchema>;
export type APIGatewayEventType = z.infer<typeof APIGatewayEventSchema>;
export type CustomEventType = z.infer<typeof CustomEventSchema>;
export type FinanceConfigType = z.infer<typeof FinanceConfigSchema>;
export type PostgresConfigType = z.infer<typeof PostgresConfigSchema>;
export type MongoConfigType = z.infer<typeof MongoConfigSchema>;
