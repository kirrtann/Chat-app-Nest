import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from 'config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'config/database.config';
import { AuthModule } from './auth/auth.module';
import * as crypto from 'crypto';
global.crypto = crypto as any;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${__dirname}/../../config/env/${process.env.NODE_ENV}.env`,
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => dataSourceOptions,
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
