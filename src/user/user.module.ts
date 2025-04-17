import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { TaskModule } from 'src/task/task.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MessageModule } from 'src/message/message.module';
import { LoginLog } from './entities/login-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, LoginLog]),
    forwardRef(() => TaskModule),
    MessageModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
