import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register-dto';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/loginUser-dto';
import { LoginUserVo } from './dto/login-user.vo';
import { UserDetailVo } from './dto/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListVo } from './dto/user-list.vo';

@Injectable()
export class UserService {
  private logger = new Logger();

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Role)
  private readonly roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private readonly permissionRepository: Repository<Permission>;

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

  async initData() {
    const user1 = new User();
    user1.username = 'zhangsan';
    user1.password = md5('111111');
    user1.email = 'xxx@xx.com';
    user1.is_admin = true;
    user1.nick_name = '张三';
    user1.phone_number = '13233323333';

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = md5('222222');
    user2.email = 'yy@yy.com';
    user2.nick_name = '李四';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }

  async login(loginUser: LoginUserDto, isAdmin: boolean) {
    const existUser = await this.userRepository.findOne({
      where: {
        username: loginUser.username,
        is_admin: isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });
    if (!existUser) {
      throw new BadRequestException('用户不存在');
    }

    if (existUser.password !== md5(loginUser.password)) {
      throw new BadRequestException('密码错误');
    }

    const vo = new LoginUserVo();

    vo.userInfo = {
      id: existUser.id,
      username: existUser.username,
      nick_name: existUser.nick_name,
      email: existUser.email,
      phone_number: existUser.phone_number,
      head_pic: existUser.head_pic,
      create_time: existUser.create_time,
      is_forzen: existUser.is_forzen,
      is_admin: existUser.is_admin,
      roles: existUser.roles.map((item) => item.name),
      permissions: existUser.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };

    return vo;
  }

  async findUserById(userId: number, is_admin) {
    const existUser = await this.userRepository.findOne({
      where: {
        id: userId,
        is_admin: is_admin,
      },
      relations: ['roles', 'roles.permissions'],
    });

    return {
      id: existUser.id,
      username: existUser.username,
      is_admin: existUser.is_admin,
      roles: existUser.roles.map((item) => item.name),
      permissions: existUser.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
  }

  async findUserDetailById(userId: number) {
    const existUser = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    const vo = new UserDetailVo();
    vo.id = existUser.id;
    vo.createTime = existUser.create_time;
    vo.email = existUser.email;
    vo.headPic = existUser.head_pic;
    vo.isFrozen = existUser.is_forzen;
    vo.nickName = existUser.nick_name;
    vo.phoneNumber = existUser.phone_number;
    vo.username = existUser.username;

    return vo;
  }

  async updatePassword(userId: number, passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(
      `update_password_captcha_${passwordDto.email}`,
    );

    if (!captcha) {
      throw new BadRequestException('验证码已失效');
    }

    if (passwordDto.captcha !== captcha) {
      throw new BadRequestException('验证码不正确');
    }

    const existUser = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    existUser.password = md5(passwordDto.password);

    try {
      await this.userRepository.save(existUser);
      return '密码修改成功';
    } catch (error) {
      return '密码修改失败';
    }
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const redisCaptcha = await this.redisService.get(
      `update_user_captcha_${updateUserDto.email}`,
    );

    if (!redisCaptcha) {
      throw new BadRequestException('验证码已失效');
    }

    if (redisCaptcha !== updateUserDto.captcha) {
      throw new BadRequestException('验证码不正确');
    }

    const existUser = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (updateUserDto.email) {
      existUser.email = updateUserDto.email;
    }
    if (updateUserDto.head_pic) {
      existUser.head_pic = updateUserDto.head_pic;
    }

    try {
      await this.userRepository.save(existUser);
      return '用户信息修改成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '用户信息修改失败';
    }
  }

  async freeze(id: number) {
    if (!id) {
      throw new BadRequestException('用户id不能为空');
    }

    const existUser = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });

    if (existUser.is_forzen) {
      throw new BadRequestException('该用户已被冻结，无需重复操作');
    }

    existUser.is_forzen = true;

    try {
      await this.userRepository.save(existUser);
      return '冻结用户成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '冻结用户失败';
    }
  }

  async findUsersByPageOption(
    page: number,
    size: number,
    username?: string,
    nick_name?: string,
    email?: string,
  ) {
    const skipCount = (page - 1) * size;

    const condition: Record<string, any> = {};

    if (username) {
      condition.username = Like(`%${username}%`);
    }
    if (nick_name) {
      condition.nick_name = Like(`%${nick_name}%`);
    }

    if (email) {
      condition.email = Like(`%${email}%`);
    }

    const [list, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'username',
        'nick_name',
        'email',
        'phone_number',
        'is_forzen',
        'head_pic',
        'create_time',
      ],
      skip: skipCount,
      take: size,
      where: condition,
    });

    const vo = new UserListVo();
    vo.list = list;
    vo.total = total;

    return vo;
  }
}
