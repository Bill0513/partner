// dto/like-reward.dto.ts
import { IsEnum, IsInt } from 'class-validator';

export enum LikeAction {
  LIKE = 'like',
  UNLIKE = 'unlike',
}
export class LikeRewardDto {
  @IsInt()
  rewardId: number;

  @IsEnum(LikeAction)
  action: LikeAction; // 'like' or 'unlike'
}
