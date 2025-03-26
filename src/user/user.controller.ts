import { Controller, Get, Query, Req, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@Controller('user')
@ApiBearerAuth()
@ApiTags('用户模块')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: Request) {
    return await this.userService.getProfile(req['user'].id);
  }

  @Get('partner')
  async setPartner(@Query('uId') uId: string, @Req() req: Request) {
    return await this.userService.setPartner(uId, req['user'].id);
  }
}
