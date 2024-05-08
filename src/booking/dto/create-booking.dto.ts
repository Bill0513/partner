import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty({
    message: '会议室名称不能为空',
  })
  @IsNumber()
  @ApiProperty()
  meetingRoomId: number;

  @IsNotEmpty({
    message: '开始时间不能为空',
  })
  @IsNumber()
  @ApiProperty()
  startTime: number;

  @IsNotEmpty({
    message: '结束时间不能为空',
  })
  @IsNumber()
  @ApiProperty()
  endTime: number;

  @ApiProperty()
  note: string;
}
