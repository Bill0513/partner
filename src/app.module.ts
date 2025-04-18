import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { Task } from './task/entities/task.entity';
import { SubTask } from './sub_task/entities/sub_task.entity';
import { TaskModule } from './task/task.module';
import { SubTaskModule } from './sub_task/sub_task.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from './login.guard';
import { RewardModule } from './reward/reward.module';
import { Reward } from './reward/entities/reward.entity';
import { Rule } from './reward/entities/rule.entity';
import { Exchange } from './reward/entities/exchange.entity';
import { MessageModule } from './message/message.module';
import { RewardLike } from './reward/entities/reward-like.entity';
import { Message } from './message/entities/message.entity';
import { AiGeneratorModule } from './ai-generator/ai-generator.module';
import { LoginLog } from './user/entities/login-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          type: 'mysql',
          host: configService.get('MYSQL_SERVER_HOST'),
          port: configService.get('MYSQL_SERVER_PORT'),
          username: configService.get('MYSQL_SERVER_USERNAME'),
          password: configService.get('MYSQL_SERVER_PASSWORD'),
          database: configService.get('MYSQL_SERVER_DATABASE'),
          synchronize: false,
          logging: configService.get<string>('NODE_ENV') !== 'production',
          entities: [
            User,
            Task,
            SubTask,
            Reward,
            Rule,
            Exchange,
            RewardLike,
            Message,
            LoginLog,
          ],
          poolSize: 5,
          connectorPackage: 'mysql2',
          timezone: '+08:00',
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
          migrationsTableName: 'typeorm_migrations',
        };
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('JWR_SECRET'),
          signOptions: {
            expiresIn: '30m',
          },
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    TaskModule,
    SubTaskModule,
    AuthModule,
    RewardModule,
    MessageModule,
    AiGeneratorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard,
    },
  ],
})
export class AppModule {}
