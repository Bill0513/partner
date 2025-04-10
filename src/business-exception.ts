// business-exception.ts
export class BusinessException {
  isBusinessException = true;

  constructor(
    public readonly businessCode: string = '100000',
    public readonly message: string = 'Business error occurred',
  ) {}

  static notFound(
    message: string = 'Resource not found',
    code: string = '100000',
  ) {
    return new BusinessException(code, message);
  }

  static badRequest(message: string = 'Bad request', code: string = '100001') {
    return new BusinessException(code, message);
  }
}
