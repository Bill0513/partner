import {
  ExecutionContext,
  SetMetadata,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiBodyOptions,
  ApiParam,
  ApiParamOptions,
  ApiQuery,
  ApiQueryOptions,
  ApiResponse,
  ApiResponseOptions,
} from '@nestjs/swagger';
import { Request } from 'express';

export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require-permission', permissions);

export const RequireLogin = () => SetMetadata('require-login', true);

export const UserInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest<Request>();

    if (!request.user) {
      return null;
    }
    return data ? request.user[data] : request.user;
  },
);

interface SwaggerDecoratorConfigType {
  query?: Array<ApiQueryOptions>;
  body?: ApiBodyOptions;
  response?: Array<ApiResponseOptions>;
  bearerAuth?: boolean;
  params?: Array<ApiParamOptions>;
}

export function SwaggerDecorator(config: SwaggerDecoratorConfigType) {
  const { body, query, params, response, bearerAuth } = config;
  const options = [];
  if (query) {
    query.forEach((v) => options.push(ApiQuery(v)));
  }
  if (body) {
    options.push(ApiBody(body));
  }
  if (params) {
    params.forEach((v) => options.push(ApiParam(v)));
  }
  if (response) {
    response.forEach((v) => options.push(ApiResponse(v)));
  }
  if (bearerAuth) {
    options.push(ApiBearerAuth());
    options.push(RequireLogin());
  }

  return applyDecorators(...options);
}
