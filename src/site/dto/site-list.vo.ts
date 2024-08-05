import { ApiProperty } from '@nestjs/swagger';

class SiteVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  desc: string;
}

export class SiteListVo {
  list: SiteVo[];

  @ApiProperty()
  total: number;
}
