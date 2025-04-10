import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 检查data是否包含业务错误码
        if (data && data.isBusinessException) {
          return {
            code: data.businessCode || '100000', // 使用业务错误码
            message: data.message || 'Business error',
            data: null,
          };
        }

        // 正常响应
        return {
          code: '000000',
          message: 'success',
          data,
        };
      }),
    );
  }
}
