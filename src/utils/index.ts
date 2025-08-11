/**
 * @fileoverview Utility functions and helpers
 * 
 * This directory contains reusable utility functions, helpers, and
 * common functionality used across the application.
 * 
 * Contents:
 * - Logger: Structured logging with different levels and metadata support
 * - Helpers: Common utility functions for data transformation, validation,
 *   response formatting, error handling, and other cross-cutting concerns
 * 
 * Purpose:
 * - Centralize common functionality to avoid code duplication
 * - Provide consistent interfaces for logging and error handling
 * - Offer reusable functions for data manipulation and validation
 * - Support debugging and monitoring with structured logging
 * 
 * All utilities should be:
 * - Pure functions when possible (no side effects)
 * - Well-tested with comprehensive unit tests
 * - Properly typed with TypeScript
 * - Documented with JSDoc comments
 * 
 * @author José Carrillo <jose.carrillo@yummysuperapp.com>
 * @since 1.0.0
 */

export * from './logger.util';
export * from './helpers.util';