import { PaginationDto } from 'src/common.dto';
import { MessageType } from 'src/constants';

export class MessageListDto extends PaginationDto {
  type: MessageType | 'all';
}
