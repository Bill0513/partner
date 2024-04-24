import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Inject,
  BadRequestException,
  UnauthorizedException,
  DefaultValuePipe,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register-dto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/loginUser-dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EMAIL_REG } from 'src/constants';
import { generateParseIntPipe } from 'src/utils';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginUserVo } from './dto/login-user.vo';
import { RefreshTokenVo } from './dto/refresh-token.vo';
import { UserDetailVo } from './dto/user-info.vo';
import { UserListVo } from './dto/user-list.vo';

@ApiTags('用户管理模块')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(RedisService)
  private readonly redisService: RedisService;

  @Inject(EmailService)
  private readonly emailService: EmailService;

  @ApiBody({
    type: RegisterDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/注册失败',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确/用于已存在',
    type: String,
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.userService.register(registerDto);
  }

  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  @Get('init')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  @ApiBody({
    type: LoginUserDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: String,
    description: '用户不存在/密码错误',
  })
  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false);

    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expires_time') || '7d',
      },
    );
    return vo;
  }

  @ApiBody({
    type: LoginUserDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: String,
    description: '用户不存在/密码错误',
  })
  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true);

    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expires_time') || '7d',
      },
    );
    return vo;
  }

  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: 'refreshToken',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'token',
    type: RefreshTokenVo,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: String,
    description: 'token错误/token 已失效，请重新登录',
  })
  @Get('refresh/token')
  async refreshToken(@Query('refreshToken') refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new BadRequestException('token错误');
      }

      const data = this.jwtService.verify(refreshToken);

      const existUser = await this.userService.findUserById(data.userId, false);

      const access_token = this.jwtService.sign(
        {
          userId: existUser.id,
          username: existUser.username,
          roles: existUser.roles,
          permissions: existUser.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );

      const refresh_token = this.jwtService.sign(
        {
          userId: existUser.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      );

      const vo = new RefreshTokenVo();
      vo.access_token = access_token;
      vo.refresh_token = refresh_token;

      return vo;
    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: 'refreshToken',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'token',
    type: RefreshTokenVo,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: String,
    description: 'token错误/token 已失效，请重新登录',
  })
  @Get('admin/refresh/token')
  async adminRefreshToken(@Query('refreshToken') refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new BadRequestException('token错误');
      }

      const data = this.jwtService.verify(refreshToken);

      const existUser = await this.userService.findUserById(data.userId, true);

      const access_token = this.jwtService.sign(
        {
          userId: existUser.id,
          username: existUser.username,
          roles: existUser.roles,
          permissions: existUser.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );

      const refresh_token = this.jwtService.sign(
        {
          userId: existUser.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      );

      const vo = new RefreshTokenVo();
      vo.access_token = access_token;
      vo.refresh_token = refresh_token;

      return vo;
    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息',
    type: UserDetailVo,
  })
  @RequireLogin()
  @Get('info')
  async info(@UserInfo('userId') userId: number) {
    return await this.userService.findUserDetailById(userId);
  }

  @ApiBody({
    type: UpdateUserPasswordDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '修改密码成功/修改密码失败',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确',
    type: String,
  })
  @ApiBearerAuth()
  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return await this.userService.updatePassword(userId, passwordDto);
  }

  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '邮箱地址错误',
    type: String,
  })
  @ApiBearerAuth()
  @RequireLogin()
  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('address') address: string) {
    if (!EMAIL_REG.test(address)) {
      throw new BadRequestException('邮箱地址错误');
    }
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_password_captcha_${address}`,
      code,
      10 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更换密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`,
    });

    return '发送成功';
  }

  @ApiBody({
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息修改成功/用户信息修改失败',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确',
    type: String,
  })
  @ApiBearerAuth()
  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(userId, updateUserDto);
  }

  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '邮箱地址错误',
    type: String,
  })
  @ApiBearerAuth()
  @RequireLogin()
  @Get('update_userInfo/captcha')
  async updateUserInfoCaptcha(@Query('address') address: string) {
    if (!EMAIL_REG.test(address)) {
      throw new BadRequestException('邮箱地址错误');
    }
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_user_captcha_${address}`,
      code,
      10 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '修改信息验证码',
      html: `<p>你的修改信息验证码是 ${code}</p>`,
    });

    return '发送成功';
  }

  @ApiQuery({
    name: 'id',
    type: Number,
    description: '用户id',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '冻结用户成功/失败',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户id不能为空/该用户已被冻结，无需重复操作',
    type: String,
  })
  @ApiBearerAuth()
  @RequireLogin()
  @Get('/admin/freeze')
  async freeze(@Query('id') id: number) {
    return await this.userService.freeze(id);
  }

  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'page',
    required: true,
  })
  @ApiQuery({
    name: 'size',
    type: Number,
    description: 'size',
    required: true,
  })
  @ApiQuery({
    name: 'username',
    type: String,
    description: 'username',
    required: false,
  })
  @ApiQuery({
    name: 'nick_name',
    type: String,
    description: 'nick_name',
    required: false,
  })
  @ApiQuery({
    name: 'email',
    type: String,
    description: 'email',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserListVo,
  })
  @ApiBearerAuth()
  @RequireLogin()
  @Get('/admin/list')
  async list(
    @Query('page', new DefaultValuePipe(1), generateParseIntPipe('page'))
    page: number,
    @Query('size', new DefaultValuePipe(10), generateParseIntPipe('size'))
    size: number,
    @Query('username') username?: string,
    @Query('nick_name') nick_name?: string,
    @Query('email') email?: string,
  ) {
    return await this.userService.findUsersByPageOption(
      page,
      size,
      username,
      nick_name,
      email,
    );
  }
}
