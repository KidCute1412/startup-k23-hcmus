import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface HttpExceptionResponseBody {
  message?: string | string[];
  error?: string;
  details?: unknown;
}

function isHttpExceptionResponseBody(
  value: unknown,
): value is HttpExceptionResponseBody {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const responseBody = isHttpExceptionResponseBody(exceptionResponse)
      ? exceptionResponse
      : undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      message = responseBody
        ? (responseBody.message ?? exception.message)
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exception.message;

      // Map HTTP status to custom error codes if desired, or default to status name
      errorCode =
        status === HttpStatus.BAD_REQUEST &&
        responseBody?.error === 'Bad Request'
          ? 'VALIDATION_ERROR'
          : responseBody?.error
            ? responseBody.error.toUpperCase().replace(/\s+/g, '_')
            : HttpStatus[status];
    } else {
      // Log generic errors for server administration
      console.error(exception);
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: Array.isArray(message) ? message.join(', ') : message,
        ...(responseBody?.details !== undefined
          ? { details: responseBody.details }
          : {}),
      },
    });
  }
}
