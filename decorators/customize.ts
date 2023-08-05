import {
   ExecutionContext,
   SetMetadata,
   createParamDecorator,
} from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const RESPONSE_MESSAGE = 'RESPONSE_MESSAGE';
export const ResponseMessage = (message: string) =>
   SetMetadata(RESPONSE_MESSAGE, message);

export const User = createParamDecorator(
   (data: unknown, ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest();
      return req.user;
   },
);

export const Cookie = createParamDecorator(
   (key: string, ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest();
      return req.cookies[key];
   },
);
