/**
 * @fileoverview Lambda function handlers
 *
 * This directory contains specialized handler functions for different
 * types of Lambda events and business logic operations.
 *
 * Purpose:
 * - Modular event handlers for specific business operations
 * - Separation of concerns from the main Lambda entry point
 * - Reusable handler logic that can be composed and tested independently
 * - Domain-specific processing logic (finance, file processing, etc.)
 *
 * Each handler should:
 * - Accept a standardized context object with logger and request metadata
 * - Return consistent response formats
 * - Handle errors gracefully with proper logging
 * - Be thoroughly tested with unit tests
 *
 * @author José Carrillo <jose.carrillo@yummysuperapp.com>
 * @since 1.0.0
 */

// Handlers will be exported here as they are created
// Example: export * from './finance.handler';
// Example: export * from './file-processing.handler';

export * from './get-bill.handler';
export * from './create-bill.handler';
