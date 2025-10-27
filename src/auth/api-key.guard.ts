import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    console.log('apiKey', apiKey);
    console.log("my api key", process.env.JWT_SECRET);
    if (apiKey !== process.env.JWT_SECRET) {  // Replace with your logic to validate API key
      throw new UnauthorizedException('Invalid API Key');
    }
    return true;
  }
}
