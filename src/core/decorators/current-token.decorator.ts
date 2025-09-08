import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authorizationHeader = request.headers['authorization'];
    if (authorizationHeader) {
      const [type, token] = authorizationHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token; // Return the extracted token
      }
    }
    return null; // Return null if the token is not present
  },
);
