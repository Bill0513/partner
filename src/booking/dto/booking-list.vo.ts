import { BookingStatus } from '../entities/booking-status';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';
import { MeetingRoom } from 'src/meeting-room/entities/meeting-room.entity';

class Booking {
  @ApiProperty()
  id: number;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty({
    enum: BookingStatus,
  })
  status: BookingStatus;

  @ApiProperty()
  note: string;

  @ApiProperty()
  createTime: Date;

  @ApiProperty()
  updateTime: Date;

  @ApiProperty({
    type: User,
  })
  user: User;

  @ApiProperty({
    type: MeetingRoom,
  })
  room: MeetingRoom;
}

export class BookingListVo {
  @ApiProperty({
    type: [Booking],
  })
  list: Booking[];

  @ApiProperty()
  total: number;
}
