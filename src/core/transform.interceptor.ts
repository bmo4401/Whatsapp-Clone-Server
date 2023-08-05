import {
   Injectable,
   NestInterceptor,
   ExecutionContext,
   CallHandler,
   BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from '@/src/decorators/customize';

export interface Response<T> {
   statusCode: number;
   message: string;
   data: any;
}

@Injectable()
export class TransformInterceptor<T>
   implements NestInterceptor<T, Response<T>>
{
   constructor(private reflector: Reflector) {}
   intercept(
      context: ExecutionContext,
      next: CallHandler,
   ): Observable<Response<T>> {
      const message = this.reflector.get<string>(
         RESPONSE_MESSAGE,
         context.getHandler(),
      );
      return next.handle().pipe(
         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
         //@ts-ignore
         catchError((err) => {
            const { response } = err;

            return throwError(
               () =>
                  new BadRequestException({
                     statusCode: err.status,
                     message,
                     data: {
                        message: Array.isArray(response.message)
                           ? response.message[0]
                           : response.message,
                        status: false,
                     },
                  }),
            );
         }),
         map((data) => {
            return {
               statusCode: context.switchToHttp().getResponse().statusCode,
               message: message,
               data,
            };
         }),
      );
   }
}
