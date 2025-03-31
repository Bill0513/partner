import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RewardService } from './reward.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('reward')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Post('create')
  @RequireLogin()
  async create(
    @Body() createRewardDto: CreateRewardDto,
    @UserInfo('id') userId,
    @UserInfo('nickname') userName,
  ) {
    return await this.rewardService.create(createRewardDto, userId, userName);
  }

  @Get()
  findAll() {
    return this.rewardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rewardService.findOne(+id);
  }

  @Post('update')
  @RequireLogin()
  async update(
    @Body() updateRewardDto: UpdateRewardDto,
    @UserInfo('id') userId: number,
    @UserInfo('nickname') userName: string,
  ) {
    return await this.rewardService.update(updateRewardDto, userId, userName);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rewardService.remove(+id);
  }

  @Get('hot')
  @RequireLogin()
  async hot(
    @Query('id') id: number,
    @UserInfo('id') userId: number,
    @UserInfo('nickname') userName: string,
  ) {
    return await this.rewardService.hot(id, userId, userName);
  }
}
