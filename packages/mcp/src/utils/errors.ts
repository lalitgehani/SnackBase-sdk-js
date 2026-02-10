import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as sdkErrors from '@snackbase/sdk';

/**
 * Maps a SnackBase SDK error to a structured MCP CallToolResult.
 * Ensures consistent error reporting across all MCP tools.
 */
export function handleToolError(error: unknown): CallToolResult {
  if (error instanceof sdkErrors.SnackBaseError) {
    let message = error.message;

    // Special handling for specific error types
    if (error instanceof sdkErrors.ValidationError) {
      if (error.fields) {
        message = `${message}\nValidation Details:\n${JSON.stringify(error.fields, null, 2)}`;
      }
    } else if (error instanceof sdkErrors.AuthenticationError) {
      message = `Authentication failed — check your SNACKBASE_API_KEY. ${error.message}`;
    } else if (error instanceof sdkErrors.AuthorizationError) {
      message = `Permission denied: ${error.message}`;
    } else if (error instanceof sdkErrors.NotFoundError) {
      message = `Not found: ${error.message}`;
    } else if (error instanceof sdkErrors.ConflictError) {
      message = `Conflict: ${error.message}`;
    } else if (error instanceof sdkErrors.RateLimitError) {
      const retryAfter = error.retryAfter ? ` Retry after ${error.retryAfter} seconds.` : '';
      message = `Rate limited.${retryAfter} ${error.message}`;
    } else if (error instanceof sdkErrors.NetworkError) {
      message = `Network error — is SnackBase running? ${error.message}`;
    } else if (error instanceof sdkErrors.TimeoutError) {
      message = `Request timed out. ${error.message}`;
    } else if (error instanceof sdkErrors.ServerError) {
      message = `Server error (${error.status}): ${error.message}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
      isError: true,
    };
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: 'text',
        text: `Unexpected error: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}
