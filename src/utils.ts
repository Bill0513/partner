import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import * as crypto from 'crypto';

export function md5(str) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}

export function generateParseIntPipe(name) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(name + ' 应该传数字');
    },
  });
}

export function errorHandler(error) {
  if (
    error instanceof BadRequestException ||
    error instanceof NotFoundException
  ) {
    throw error;
  } else {
    throw new InternalServerErrorException(`系统错误: ${error.message}`);
  }
}
