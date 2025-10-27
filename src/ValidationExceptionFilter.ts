import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse() as any;

    let formattedErrors = {};
    
    if (Array.isArray(exceptionResponse.message)) {
      formattedErrors = exceptionResponse.message.reduce((acc, error: ValidationError) => {
        if (error.constraints) {
          acc[error.property] = Object.values(error.constraints).map(msg =>
            msg.replace(error.property, '').trim().replace(/^./, (char) => char.toUpperCase()) // Capitalize first letter
          );
        }
        return acc;
      }, {});
    }

    const errorResponse = {
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      code: 400,
    };

    response.status(400).json(errorResponse);
  }
}
