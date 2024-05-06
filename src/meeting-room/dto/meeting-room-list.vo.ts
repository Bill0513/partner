import { ApiProperty } from '@nestjs/swagger';

class MeetingRoomVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  equipment: string;

  @ApiProperty()
  isBooked: boolean;
}

export class MeetingRoomListVo {
  @ApiProperty({
    type: [MeetingRoomVo],
  })
  list: MeetingRoomVo[];

  @ApiProperty()
  total: number;
}
