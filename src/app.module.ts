import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from 'config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { dataSourceOptions } from './data-source';
import { UserTokenModule } from './modules/user-token/user-token.module';
import { OtpModule } from './modules/otp/otp.module';
import { ChatModule } from './modules/chat/chat.module';
import { ContactModule } from './modules/contact/contact.module';

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
