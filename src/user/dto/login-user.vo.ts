interface UserInfo {
  id: number;

  username: string;

  nick_name: string;

  email: string;

  head_pic: string;

  phone_number: string;

  is_forzen: boolean;

  is_admin: boolean;

  create_time: Date;

  roles: string[];

  permissions: PermissionType[];
}

export class LoginUserVo {
  userInfo: UserInfo;

  accessToken: string;

  refreshToken: string;
}

export interface PermissionType {
  id: number;
  code: string;
  description: string;
}
