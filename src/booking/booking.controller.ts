import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SwaggerDecorator, UserInfo } from 'src/custom.decorator';
import { ApiTags } from '@nestjs/swagger';
import { BookingListVo } from './dto/booking-list.vo';

@ApiTags('预约管理模块')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('init')
  async initData() {
    return await this.bookingService.initData();
  }

  @SwaggerDecorator({
    query: [
      {
        name: 'page',
        description: 'page',
        type: Number,
        required: true,
        example: 1,
      },
      {
        name: 'size',
        description: 'size',
        type: Number,
        required: true,
        example: 10,
      },
      {
        name: 'username',
        description: 'username',
        type: String,
        required: false,
        example: '',
      },
      {
        name: 'meetingRoomName',
        description: 'meetingRoomName',
        type: String,
        required: false,
        example: '',
      },
      {
        name: 'bookingTimeRangeStart',
        description: 'bookingTimeRangeStart',
        type: Number,
        required: false,
      },
      {
        name: 'bookingTimeRangeEnd',
        description: 'bookingTimeRangeEnd',
        type: Number,
        required: false,
      },
    ],
    response: [
      {
        type: BookingListVo,
        status: HttpStatus.OK,
      },
    ],
    bearerAuth: true,
  })
  @Get('list')
  async list(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe()) page: number,
    @Query('size', new DefaultValuePipe(10), new ParseIntPipe()) size: number,
    @Query('username') username: string,
    @Query('meetingRoomName') meetingRoomName: string,
    @Query('meetingRoomPosition') meetingRoomPosition: string,
    @Query('bookingTimeRangeStart') bookingTimeRangeStart: number,
    @Query('bookingTimeRangeEnd') bookingTimeRangeEnd: number,
  ) {
    return this.bookingService.find(
      page,
      size,
      username,
      meetingRoomName,
      meetingRoomPosition,
      bookingTimeRangeStart,
      bookingTimeRangeEnd,
    );
  }

  @SwaggerDecorator({
    response: [
      {
        type: String,
        description: '预定成功',
        status: HttpStatus.OK,
      },
      {
        type: String,
        description: '会议室不存在/该时间段已被预定',
        status: HttpStatus.BAD_REQUEST,
      },
    ],
    body: {
      type: CreateBookingDto,
    },
    bearerAuth: true,
  })
  @Post('add')
  async add(
    @Body() createBookingDto: CreateBookingDto,
    @UserInfo('userId') userId: number,
  ) {
    return await this.bookingService.add(createBookingDto, userId);
  }

  @SwaggerDecorator({
    params: [
      {
        name: 'id',
        description: 'id',
        type: Number,
        required: true,
      },
    ],
    response: [
      {
        type: String,
        status: HttpStatus.OK,
        description: 'success',
      },
      {
        type: String,
        status: HttpStatus.BAD_REQUEST,
        description: '预定不存在/该预定不能操作',
      },
    ],
    bearerAuth: true,
  })
  @Get('apply/:id')
  async apply(@Param('id') id: number) {
    return this.bookingService.apply(id);
  }

  @SwaggerDecorator({
    params: [
      {
        name: 'id',
        description: 'id',
        type: Number,
        required: true,
      },
    ],
    response: [
      {
        type: String,
        status: HttpStatus.OK,
        description: 'success',
      },
      {
        type: String,
        status: HttpStatus.BAD_REQUEST,
        description: '预定不存在/该预定不能操作',
      },
    ],
    bearerAuth: true,
  })
  @Get('reject/:id')
  async reject(@Param('id') id: number) {
    return this.bookingService.reject(id);
  }

  @SwaggerDecorator({
    params: [
      {
        name: 'id',
        description: 'id',
        type: Number,
        required: true,
      },
    ],
    response: [
      {
        type: String,
        status: HttpStatus.OK,
        description: 'success',
      },
      {
        type: String,
        status: HttpStatus.BAD_REQUEST,
        description: '预定不存在/该预定不能操作',
      },
    ],
    bearerAuth: true,
  })
  @Get('unbind/:id')
  async unbind(@Param('id') id: number) {
    return this.bookingService.unbind(id);
  }

  @SwaggerDecorator({
    params: [
      {
        name: 'id',
        description: 'id',
        type: Number,
        required: true,
      },
    ],
    response: [
      {
        type: String,
        status: HttpStatus.OK,
        description: 'success',
      },
    ],
    bearerAuth: true,
  })
  @Get('urge/:id')
  async urge(@Param('id') id: number) {
    return this.bookingService.urge(id);
  }
}
