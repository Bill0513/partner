import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';

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

  @Get('partner-unbind')
  @RequireLogin()
  async unbindPartner(@UserInfo('id') userId) {
    return await this.userService.unbindPartner(userId);
  }

  @Post('update-avatar')
  @RequireLogin()
  async updateAvatar(
    @Body() updateAvatarDto: UpdateAvatarDto,
    @UserInfo('id') userId: number,
  ) {
    return await this.userService.updateAvatar(userId, updateAvatarDto);
  }

  @Get('avatar')
  @RequireLogin()
  async getAvatar(@Query('id') id: number) {
    return await this.userService.getAvatarById(id);
  }
}
