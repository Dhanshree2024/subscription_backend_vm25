import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsMiddleware } from './common/middleware/cors.middleware'; // Ensure the correct import
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
dotenv.config()
import * as session from 'express-session'; // Import as a namespace
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './ValidationExceptionFilter';
import * as bodyParser from 'body-parser';
import { OrganizationService } from './organizational-profile/organizational-profile.service';

const expressSession = session.default || session; // Compatibility workaround

// import { JwtAuthGuard } from './auth/jwt-auth.guard';
// import { JwtService } from '@nestjs/jwt'; // Import JwtService

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //   app.useGlobalPipes(
  //   new ValidationPipe({
  //     exceptionFactory: (errors) => new BadRequestException(errors),
  //   })
  // );

  // app.useGlobalFilters(new ValidationExceptionFilter());

  // Apply JwtAuthGuard globally
  // app.useGlobalGuards(new JwtAuthGuard(new JwtService({ secret: 'Asset@2024' }))); // Pass the JwtService instance here with secret
  // Apply CorsMiddleware globally
  // app.use(CorsMiddleware);

  // Enable CORS
  app.enableCors({
    // origin: 'http://localhost:3000', // Allow all origins
    origin: ['http://192.168.1.139:3005','http://192.168.1.115:3000','http://192.168.1.115:3001','http://localhost:3000','http://localhost:3001', 'http://192.168.1.139:3001','http://localhost:3005', 'http://192.168.1.148:3005','http://192.168.1.25:3001','http://192.168.1.25:3005'],
    methods: 'GET, POST, PUT, DELETE, OPTIONS', // Allowed HTTP methods
    allowedHeaders: 'Content-Type, Authorization, X-API-KEY', // Allowed headers
    credentials: true, // Allow cookies
    exposedHeaders: ['Content-Disposition'], // ✅ Add this line
  });


  // Use cookie-parser middleware
  app.use(
    cookieParser(),
    expressSession({
      secret: process.env.JWT_SECRET, // Replace with your own secret
      resave: false,
      saveUninitialized: false,
      // cookie: {
      //   // secure: isProd,
      //   httpOnly: true,
      //   maxAge: 3600000, // 1-hour session
      // },
    }),
  );
  
  
  // session middleware
  // 2. express-session middleware
  // app.use(
  //   session({
  //     secret: process.env.JWT_SECRET || 'mysecret', // keep this in .env
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: {
  //       httpOnly: true,
  //       maxAge: 3600000, // 1 hour
  //       // secure: process.env.NODE_ENV === 'production', // enable only with https
  //     },
  //   }),
  // );
  
  
  

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // await app.listen(process.env.PORT ?? 8012);
await app.listen(process.env.PORT ?? 8015, '0.0.0.0');

// Replace with your laptop's IP
const laptopIp = '192.168.1.25';
const port = process.env.PORT ?? 8015;

console.log(`
🚀 Server running at:
   - Local:   http://localhost:${port}
   - Network: http://${laptopIp}:${port}
`);

  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 8015}`);
  
  
}
bootstrap();
