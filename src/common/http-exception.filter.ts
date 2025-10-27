import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const exceptionResponse = exception.getResponse();

    // Flatten the error messages and create a single message
    const errorMessages = Array.isArray(exceptionResponse['message']) 
      ? exceptionResponse['message'].join(', ') 
      : exceptionResponse['message'];

    // Send the formatted response
    response.status(400).json({
      statusCode: 400,
      message: errorMessages, // Single string message instead of an array
    });
  }
}
