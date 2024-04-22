import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register-dto';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils';

@Injectable()
export class UserService {
  private logger = new Logger();

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @Inject(RedisService)
  private readonly redisService: RedisService;

  async register(registerDto: RegisterDto) {
    const captcha = await this.redisService.get(`captcha_${registerDto.email}`);

    if (!captcha) {
      throw new BadRequestException('验证码已失效');
    }

    if (captcha !== registerDto.captcha) {
      throw new BadRequestException('验证码不正确');
    }

    const existUser = await this.userRepository.findOne({
      where: {
        username: registerDto.username,
      },
    });
    if (existUser) {
      throw new BadRequestException('用户名已存在');
    }

    const newUser = new User();
    newUser.username = registerDto.username;
    newUser.password = md5(registerDto.password);
    newUser.email = registerDto.email;
    newUser.nick_name = registerDto.nickname;

    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '注册失败';
    }
  }
}
