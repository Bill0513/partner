import { Controller, Get, Query, Req, Request } from '@nestjs/common';
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
  async getProfile(@Req() req: Request, @UserInfo('id') userId) {
    return await this.userService.getProfile(userId);
  }

  @Get('partner')
  async setPartner(@Query('uId') uId: string, @UserInfo('id') userId) {
    return await this.userService.setPartner(uId, userId);
  }
}
