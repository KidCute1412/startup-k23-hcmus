import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      message = typeof exceptionResponse === 'object' 
        ? exceptionResponse.message || exception.message 
        : exceptionResponse;

      // Map HTTP status to custom error codes if desired, or default to status name
      errorCode = typeof exceptionResponse === 'object' && exceptionResponse.error
        ? exceptionResponse.error.toUpperCase().replace(/\s+/g, '_')
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
      },
    });
  }
}
