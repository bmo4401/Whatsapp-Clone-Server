import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { TransformInterceptor } from '@/src/core/transform.interceptor';

const PORT_ENV = 'PORT';
async function bootstrap() {
   const app = await NestFactory.create<NestExpressApplication>(AppModule);
   const reflector = app.get(Reflector);

   /* configService */
   const configService = app.get(ConfigService);
   const PORT = configService.get(PORT_ENV);

   /* static */
   app.useStaticAssets(join(__dirname, '../..', 'uploads'));

   /* cors */
   app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      credentials: true, //exchange cookie with client
   });
   /* middleware */
   app.useGlobalInterceptors(new TransformInterceptor(reflector));
   app.useGlobalPipes(new ValidationPipe());
   /* cookie */
   app.use(cookieParser());
   /* version */
   app.setGlobalPrefix('api');
   app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: ['1'],
   });
   await app.listen(PORT, () => `Listening on ${PORT}`);
}
bootstrap();
