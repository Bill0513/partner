import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nick_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone_number: string;

  @ApiProperty()
  is_forzen: boolean;

  @ApiProperty()
  head_pic: string;
  @ApiProperty()
  create_time: Date;
}

export class UserListVo {
  @ApiProperty({
    type: [User],
  })
  list: User[];
  @ApiProperty()
  total: number;
}
