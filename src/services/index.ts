/**
 * @fileoverview Business logic services
 *
 * This directory contains service classes that encapsulate business logic
 * and external API integrations for the Financial Backoffice operations.
 *
 * Purpose:
 * - Business logic abstraction from handlers and controllers
 * - External API integrations (Finance API, N8N, third-party services)
 * - Data transformation and validation
 * - Complex business rules and calculations
 * - Service orchestration and workflow management
 *
 * Each service should:
 * - Implement a clear interface with well-defined methods
 * - Handle external dependencies through dependency injection
 * - Provide comprehensive error handling and logging
 * - Be stateless and thread-safe
 * - Include proper input validation and output formatting
 *
 * @author José Carrillo <jose.carrillo@yummysuperapp.com>
 * @since 1.0.0
 */

export * from './finance.service';
