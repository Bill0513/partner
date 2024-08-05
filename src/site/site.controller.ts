import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { SwaggerDecorator, UserInfo } from 'src/custom.decorator';
import { SiteListVo } from './dto/site-list.vo';

@Controller('site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @SwaggerDecorator({
    query: [
      {
        name: 'title',
        description: 'title',
        type: String,
        required: true,
        example: '标题',
      },
    ],
    response: [
      {
        type: SiteListVo,
        status: HttpStatus.OK,
      },
    ],
    bearerAuth: true,
  })
  @Get('list')
  async list(
    @Query('title') title: string,
    @UserInfo('userId') userId: number,
  ) {
    return await this.siteService.list(title, userId);
  }

  @SwaggerDecorator({
    response: [
      {
        type: String,
        description: '创建成功',
        status: HttpStatus.OK,
      },
      {
        type: String,
        description: '该地址已存在',
        status: HttpStatus.BAD_REQUEST,
      },
    ],
    body: {
      type: CreateSiteDto,
    },
    bearerAuth: true,
  })
  @Post('create')
  async create(
    @Body() createSiteDto: CreateSiteDto,
    @UserInfo('userId') userId: number,
  ) {
    return await this.siteService.create(createSiteDto, userId);
  }
}
