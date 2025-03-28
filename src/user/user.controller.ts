import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('user')
@ApiBearerAuth()
@ApiTags('用户模块')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  @RequireLogin()
  async getProfile(@UserInfo('id') userId) {
    return await this.userService.getProfile(userId);
  }

  @Get('partner')
  @RequireLogin()
  async setPartner(@Query('uId') uId: string, @UserInfo('id') userId) {
    return await this.userService.setPartner(uId, userId);
  }
}
