import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RewardService } from './reward.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { RewardFindAllDto } from './dto/list-reward.dto';
import { RemoveRewardDto } from './dto/remove-reward.dto';
import {
  ExchangeDto,
  ExchangeListDto,
  ExchangeOperationDto,
} from './dto/exchange.dto';

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

  @Get('list')
  @RequireLogin()
  async list(
    @Query() queryDto: RewardFindAllDto,
    @UserInfo('id') userId: number,
  ) {
    return await this.rewardService.list(queryDto, userId);
  }

  @Get('detail')
  @RequireLogin()
  async detail(@Query('id') id: number) {
    return await this.rewardService.detail(id);
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

  @Get('exchange/list')
  @RequireLogin()
  async exchangeList(
    @Query() exchangeListDto: ExchangeListDto,
    @UserInfo('id') userId: number,
  ) {
    return await this.rewardService.exchangeList(exchangeListDto, userId);
  }

  @Post('exchange')
  @RequireLogin()
  async exchange(
    @Body() exchangeDto: ExchangeDto,
    @UserInfo('id') userId: number,
    @UserInfo('nickname') userName: string,
  ) {
    return await this.rewardService.exchange(exchangeDto, userId, userName);
  }

  @Post('exchange/operation')
  @RequireLogin()
  async exchangeOperation(
    @Body() exchangeOperationDto: ExchangeOperationDto,
    @UserInfo('id') userId: number,
    @UserInfo('nickname') userName: string,
  ) {
    return await this.rewardService.exchangeOperation(
      exchangeOperationDto,
      userId,
      userName,
    );
  }

  @Post('remove')
  @RequireLogin()
  async remove(@Body() removeDto: RemoveRewardDto) {
    return await this.rewardService.remove(removeDto);
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
