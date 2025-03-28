import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from 'config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import * as crypto from 'crypto';
import { dataSourceOptions } from './data-source';
import { UserTokenModule } from './modules/user-token/user-token.module';
import { OtpModule } from './modules/otp/otp.module';
// import { ChatGateway } from './chat/chat.gateway';
import { ChatModule } from './chat/chat.module';
import { ContactModule } from './modules/contact/contact.module';

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
    UserTokenModule,
    OtpModule,
    ChatModule,
    ContactModule,
   
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
