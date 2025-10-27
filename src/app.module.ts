import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationModule } from './organization_register/organization.module';
import { CorsMiddleware } from './common/middleware/cors.middleware'; // Import CORS Middleware
import { AuthModule } from './auth/auth.module';
// import { UserRepository } from './user/user.repository';
// import { JwtAuthGuard } from './auth/jwt-auth.guard'; // Import JwtAuthGuard
// import { ApiKeyGuard } from './auth/api-key.guard';
// import { EmployeeModule } from './employee/employee.module';
import { OrganizationalProfileModule } from './organizational-profile/organizational-profile.module';
import { SetSchemaMiddleware } from './dynamic-schema/set-schema.middleware'; // Correct the import path
import { DatabaseModule } from './dynamic-schema/database.module'; // Import DatabaseModule

import cookieParser from 'cookie-parser';
import { ScheduleModule } from '@nestjs/schedule';

import { AssetCategoriesModule } from './assets-data/asset-categories/asset-categories.module';
import { AssetSubcategoriesModule } from './assets-data/asset-subcategories/asset-subcategories.module';
import { AssetItemsModule } from './assets-data/asset-items/asset-items.module';
import { AssetFieldsModule } from './assets-data/asset-fields/asset-fields.module';
import { AssetDataModule } from './assets-data/asset-data/asset-data.module';
import { AssetItemsFieldsMappingModule } from './assets-data/asset-items-fields-mapping/asset-items-fields-mapping.module';
import { RolesPermissionsModule } from './roles_permissions/roles_permissions.module';
import { AssetsStatusModule } from './assets-data/assets-status/assets-status.module';
import { AssetWorkingStatusModule } from './assets-data/asset-working-status/asset-working-status.module';
import { AssetOwnershipStatusModule } from './assets-data/asset-ownership-status/asset-ownership-status.module';
import { AssetMappingModule } from './asset-mapping/asset-mapping.module';
import { StocksModule } from './assets-data/stocks/stocks.module';
import { MailService } from './common/mail/mail.service';
import { MailConfigService } from './common/mail/mail-config.service';
import { MailModule } from './common/mail/mail.module';
import { OrganizationRolesPermissionModule } from './organization_roles_permission/organization_roles_permission.module';
import { ProfileImageModule } from './profile-image/profile-image.module';
import { AssetDepreciationModule } from './asset-depreciation/asset-depreciation.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { Locations } from './organizational-profile/entity/locations.entity';
import { Pincodes } from './organizational-profile/public_schema_entity/pincode.entity';
import { Session } from './organizational-profile/public_schema_entity/sessions.entity';
import { AssetStockSerialsRepository } from './assets-data/stocks/entities/asset_stock_serials.entity';
import { SubscriptionModule } from './subscription_pricing/subscription.module';
import { CronJobModule } from './common/cron_jobs/cronjob.module';
@Module({

  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule, OrganizationModule, AuthModule],
    //   useFactory: (configService: ConfigService) => ({
    //     type: 'postgres',
    //     host: configService.get<string>('DB_HOST'),
    //     port: configService.get<number>('DB_PORT'),
    //     username: configService.get<string>('DB_USERNAME'),
    //     password: configService.get<string>('DB_PASSWORD'),
    //     database: configService.get<string>('DB_NAME'),
    //     // schema: configService.get<string>('DB_SCHEMA'),
    //     autoLoadEntities: true,
    //     synchronize: false,
    //     logging: true, // Enable query logging
    //   }),
    //   inject: [ConfigService],
    // }),
    TypeOrmModule.forRootAsync({
      
      imports: [
        ConfigModule,
        OrganizationModule,
        AuthModule,
        ServeStaticModule.forRoot({
          rootPath: join(process.cwd(), 'uploads'),
          serveRoot: '/uploads',
          serveStaticOptions: { index: false },
        }),
        ScheduleModule.forRoot(), 
        CronJobModule,
      ],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    OrganizationModule,
    AuthModule,
    OrganizationalProfileModule,
    DatabaseModule,
    AssetCategoriesModule,
    AssetSubcategoriesModule,
    AssetItemsModule,
    AssetFieldsModule,
    AssetDataModule,
    AssetItemsFieldsMappingModule,
    RolesPermissionsModule,
    AssetsStatusModule,
    AssetWorkingStatusModule,
    AssetOwnershipStatusModule,
    AssetMappingModule,
    StocksModule,
    MailModule,
    OrganizationRolesPermissionModule,
    ProfileImageModule,
    AssetDepreciationModule,
    AssetStockSerialsRepository,
    Locations,
    SubscriptionModule,
    Pincodes,
    Session
   
  ],

  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cookieParser()) // Apply cookie-parser to parse cookies
      .forRoutes('*');
    consumer
      .apply(CorsMiddleware) // Apply CORS Middleware globally
      .forRoutes('*');
     consumer.apply(SetSchemaMiddleware).forRoutes('*'); // Apply the middleware globally to all routes
  }
}
