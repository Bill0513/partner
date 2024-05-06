import { ApiProperty } from '@nestjs/swagger';

export class MeetingRoomDetailVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  location: string;

  @ApiProperty()
  equipment: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isBooked: boolean;
}
