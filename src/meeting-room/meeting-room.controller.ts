import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { SwaggerDecorator } from 'src/custom.decorator';
import { MeetingRoomListVo } from './dto/meeting-room-list.vo';
import { ApiTags } from '@nestjs/swagger';
import { MeetingRoomDetailVo } from './dto/meeting-room-detail.vo';

@ApiTags('会议室管理模块')
@Controller('meeting-room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  @Get('init')
  async init() {
    await this.meetingRoomService.initData();
    return 'done';
  }

  @SwaggerDecorator({
    query: [
      {
        name: 'page',
        type: Number,
        description: 'page',
        required: true,
        example: 1,
      },
      {
        name: 'size',
        type: Number,
        description: 'size',
        required: true,
        example: 10,
      },
      {
        name: 'name',
        type: String,
        description: '名称',
        required: false,
        example: '',
      },
      {
        name: 'capacity',
        type: Number,
        description: '容量',
        required: false,
        example: 10,
      },
      {
        name: 'equipment',
        type: String,
        description: '设备',
        required: false,
        example: '',
      },
    ],
    response: [
      {
        status: HttpStatus.OK,
        type: MeetingRoomListVo,
      },
    ],
    bearerAuth: true,
  })
  @Get('list')
  async list(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe()) page: number,
    @Query('size', new DefaultValuePipe(10), new ParseIntPipe()) size: number,
    @Query('name') name: string,
    @Query('capacity') capacity: number,
    @Query('equipment') equipment: string,
  ) {
    return await this.meetingRoomService.findMeetingRoomByPageOption(
      page,
      size,
      name,
      capacity,
      equipment,
    );
  }

  @SwaggerDecorator({
    body: {
      type: CreateMeetingRoomDto,
    },
    response: [
      {
        status: HttpStatus.OK,
        description: 'success',
        type: String,
      },
      {
        status: HttpStatus.BAD_REQUEST,
        description: '会议室名称已存在/会议室不存在',
        type: String,
      },
    ],
    bearerAuth: true,
  })
  @Post('create')
  async create(@Body() meetingRoomDto: CreateMeetingRoomDto) {
    return await this.meetingRoomService.create(meetingRoomDto);
  }

  @SwaggerDecorator({
    body: {
      type: UpdateMeetingRoomDto,
    },
    response: [
      {
        status: HttpStatus.OK,
        description: 'success',
        type: String,
      },
      {
        status: HttpStatus.BAD_REQUEST,
        description: '会议室不存在',
        type: String,
      },
    ],
    bearerAuth: true,
  })
  @Put('update')
  async update(@Body() meetingRoomDto: UpdateMeetingRoomDto) {
    return await this.meetingRoomService.update(meetingRoomDto);
  }

  @SwaggerDecorator({
    params: [
      {
        name: 'id',
        type: Number,
        description: '会议室id',
        required: true,
      },
    ],
    response: [
      {
        status: HttpStatus.OK,
        type: MeetingRoomDetailVo,
      },
    ],
    bearerAuth: true,
  })
  @Get(':id')
  async find(@Param('id') id: number) {
    return await this.meetingRoomService.findById(id);
  }

  @SwaggerDecorator({
    params: [
      {
        name: 'id',
        type: Number,
        description: '会议室id',
        required: true,
      },
    ],
    response: [
      {
        status: HttpStatus.OK,
        description: 'success',
        type: String,
      },
    ],
    bearerAuth: true,
  })
  @Delete(':id')
  async delete(@Param('id') id: number) {
    return await this.meetingRoomService.delete(id);
  }
}
