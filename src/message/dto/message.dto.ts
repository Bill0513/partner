import { PaginationDto } from '../../common.dto';
import { MessageType } from '../../constants';

export class MessageListDto extends PaginationDto {
  type: MessageType | 'all';
}
