import { ApiProperty } from '@nestjs/swagger';

export class PermissionType {
  @ApiProperty()
  id: number;
  @ApiProperty()
  code: string;
  @ApiProperty()
  description: string;
}

class UserInfo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  nick_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  head_pic: string;

  @ApiProperty()
  phone_number: string;

  @ApiProperty()
  is_forzen: boolean;

  @ApiProperty()
  is_admin: boolean;

  @ApiProperty()
  create_time: Date;

  @ApiProperty()
  roles: string[];

  @ApiProperty({
    type: [PermissionType],
  })
  permissions: PermissionType[];
}

export class LoginUserVo {
  @ApiProperty()
  userInfo: UserInfo;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
