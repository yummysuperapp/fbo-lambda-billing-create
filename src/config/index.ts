/**
 * @fileoverview Configuration Module Index
 *
 * This module serves as the main entry point for all configuration
 * related functionality. It re-exports configuration objects and
 * utilities from specialized modules.
 *
 * Modules:
 * - environment: Environment variable validation and parsing
 * - app: Application configuration factory and setup
 *
 * This modular approach separates concerns between environment
 * variable validation and configuration object creation, making
 * the codebase more maintainable and testable.
 *
 * @author José Carrillo <jose.carrillo@yummysuperapp.com>
 * @since 1.0.0
 */

// Re-export configuration objects and utilities
export { config, NODE_ENV, IS_LOCAL, IS_DEVELOPMENT, IS_PRODUCTION, ALLOWED_S3_BUCKETS } from './app.config';
export { env, validateEnvironment, type EnvVars } from './environment.config';
