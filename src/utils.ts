import { HttpException, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import { BusinessException } from './business-exception';

export function md5(str) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}

export function errorHandler(error: any) {
  // 如果是已知的HTTP异常，直接抛出
  if (error instanceof HttpException) {
    throw error;
  }
  // 如果是业务异常，直接返回（不抛出）
  else if (error instanceof BusinessException) {
    return error; // 返回业务异常对象，由响应拦截器处理
  }
  // 如果是普通Error，检查是否有特定错误标记
  else if (error instanceof Error) {
    // 可以根据错误消息或其他属性判断错误类型
    if (error.message.includes('not found')) {
      return BusinessException.notFound(error.message);
    } else if (error.message.includes('validation')) {
      return BusinessException.badRequest(error.message);
    } else {
      // 未知系统错误
      throw new InternalServerErrorException(`系统错误: ${error.message}`);
    }
  }
  // 其他未知错误
  else {
    throw new InternalServerErrorException('未知系统错误');
  }
}
