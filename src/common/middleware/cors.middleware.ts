import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// @Injectable()
// export class CorsMiddleware implements NestMiddleware {
//   use(req: Request, res: Response, next: NextFunction) {
//     console.log('send api key:', req.headers['x-api-key']); // Log the API Key
//     res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

//     res.setHeader(
//       'Access-Control-Allow-Methods',
//       'GET, POST, PUT, DELETE, OPTIONS',
//     );
//     res.setHeader(
//       'Access-Control-Allow-Headers',
//       'Content-Type, Authorization, X-API-KEY',
//     );
//     res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
//     res.setHeader('Access-Control-Allow-Credentials', 'true');

//     if (req.method === 'OPTIONS') {
//       res.status(204).end(); // Preflight request handling
//     } else {
//       next(); // Proceed to the next middleware or controller
//     }
//   }
// }
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('send api key:', req.headers['x-api-key']); // Log the API Key

    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001','http://localhost:3005', 'http://192.168.1.139:3005','http://192.168.1.142:3005','http://192.168.1.139','http://192.168.1.115', 'http://192.168.1.139:3001', 'http://192.168.1.148:3005','http://192.168.1.25:3005'];
    const origin = req.headers.origin as string;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-API-KEY',
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(204).end(); // Preflight request handling
    } else {
      next(); // Proceed to the next middleware or controller
    }
  }
}