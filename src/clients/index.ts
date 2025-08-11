/**
 * @fileoverview Client modules for external services and databases
 * 
 * This directory contains client implementations for various external services:
 * - S3: AWS S3 storage operations
 * - HTTP: Generic HTTP client for API calls
 * - PostgreSQL: Database operations for relational data
 * - MongoDB: Database operations for document-based data
 * 
 * Each client provides a consistent interface for their respective services
 * with proper error handling, logging, and connection management.
 */

export * from './s3.client';
export * from './http.client';
export * from './postgres.client';
export * from './mongo.client';