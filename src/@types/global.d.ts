/**
 * @fileoverview Global Type Declarations
 *
 * This file contains global type declarations that are available
 * throughout the entire project without explicit imports.
 *
 * These types are automatically available in all TypeScript files
 * within the project scope.
 */

declare global {
  /**
   * Global namespace for project-wide types
   */
  namespace FBOLambda {
    // Application-wide constants
    type Environment = 'development' | 'production' | 'testing';
    type LogLevel = 'debug' | 'info' | 'warn' | 'error';

    // Common utility types
    type Nullable<T> = T | null;
    type Optional<T> = T | undefined;
    type AsyncResult<T> = Promise<T>;
    type StringRecord = Record<string, string>;
    type UnknownRecord = Record<string, unknown>;

    // Database operation results
    type DatabaseResult<T> = {
      success: boolean;
      data?: T;
      error?: string;
      metadata?: UnknownRecord;
    };

    // Common response patterns
    type OperationResult<T = unknown> = {
      success: boolean;
      data?: T;
      message?: string;
      errors?: string[];
      timestamp: string;
    };
  }
}

// Make this file a module to avoid global scope pollution
export {};
