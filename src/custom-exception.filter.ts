import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from './business-exception';

@Catch(HttpException, BusinessException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | BusinessException, host: ArgumentsHost) {
    const response: Response = host.switchToHttp().getResponse<Response>();

    // 处理业务异常
    if ('isBusinessException' in exception && exception.isBusinessException) {
      return response
        .status(200) // 返回200状态码
        .json({
          code: exception.businessCode,
          message: exception.message,
          data: null,
        })
        .end();
    }

    // 处理HTTP异常
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const exceptionResponse =
      exception instanceof HttpException
        ? (exception.getResponse() as { message: string | string[] })
        : { message: 'Internal server error' };

    let errorMessage: string;

    if (exceptionResponse?.message instanceof Array) {
      errorMessage = exceptionResponse.message.join(', ');
    } else if (typeof exceptionResponse?.message === 'string') {
      errorMessage = exceptionResponse.message;
    } else {
      errorMessage =
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error';
    }

    response
      .status(status)
      .json({
        code: status.toString(),
        message: errorMessage,
        data: null,
      })
      .end();
  }
}
