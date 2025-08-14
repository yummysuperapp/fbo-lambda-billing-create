import { HttpMethod, HttpStatus, HttpStatusMessage } from '@/constants';

/**
 * HTTP Methods And Response
 */

// Type for HTTP status methods
export type HttpMethodType = typeof HttpMethod[keyof typeof HttpMethod];

// Type for HTTP status codes
export type HttpStatusType = typeof HttpStatus[keyof typeof HttpStatus];

// Type for HTTP status message
export type HttpStatusMessageType = typeof HttpStatusMessage[keyof typeof HttpStatusMessage];
