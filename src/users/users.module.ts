import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import ms from 'ms';
const JWT_ACCESS_TOKEN_SECRET = 'JWT_ACCESS_TOKEN_SECRET';
const JWT_ACCESS_TOKEN_EXPIRES = 'JWT_ACCESS_TOKEN_EXPIRES';
@Module({
   imports: [
      JwtModule.registerAsync({
         imports: [ConfigModule],
         useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>(JWT_ACCESS_TOKEN_SECRET),
            signOptions: {
               expiresIn:
                  ms(
                     configService.get<string>(
                        JWT_ACCESS_TOKEN_EXPIRES,
                     ) as string,
                  ) / 1000,
            },
         }),

         inject: [ConfigService],
      }),
   ],
   controllers: [UsersController],
   providers: [UsersService, PrismaService, JwtService],
   exports: [UsersService],
})
export class UsersModule {}
